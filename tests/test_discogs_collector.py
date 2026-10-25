"""Collector integrity checks run on every public-market-signal refresh."""
import datetime as dt
import importlib.util
import tempfile
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "scripts" / "collect_discogs.py"
spec = importlib.util.spec_from_file_location("collect_discogs", MODULE)
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class CollectorTests(unittest.TestCase):
    def test_normalization_rejects_missing_or_invalid_ask(self):
        info = {"id": 42, "title": "Reissue", "year": 2000, "artists": [{"name": "Artist"}]}
        stats = {"lowest_price": {"value": 19.0, "currency": "USD"}, "num_for_sale": 2}
        item = collector.normalized_release(42, info, stats)
        self.assertEqual(item["priceType"], "lowest_current_asking_price")
        self.assertFalse(item["soldPriceVerified"])
        self.assertEqual(item["url"], "https://www.discogs.com/release/42")
        for bad in [-1, float("nan"), None, True, 0]:
            stats["lowest_price"]["value"] = bad
            self.assertIsNone(collector.normalized_release(42, info, stats))

    def test_all_collected_inputs_are_reference_snapshots(self):
        def fake_fetch(path):
            release_id = int(path.split("/")[-1].split("?")[0])
            if path.startswith("/releases/"):
                return {"id": release_id, "title": "Album", "artists": [{"name": "Artist"}]}
            return {"lowest_price": {"value": 25.0, "currency": "USD"}, "num_for_sale": 3}
        now = dt.datetime(2026, 10, 25, 10, 0, tzinfo=dt.timezone.utc)
        snap = collector.build_snapshot(fetcher=fake_fetch, clock=lambda: now, pause=lambda _: None)
        self.assertEqual(len(snap["items"]), 6)
        self.assertEqual(snap["kind"], "current_asking_price_floor_not_sold")
        self.assertEqual(snap["expiresAt"], "2026-10-25T15:30:00Z")
        self.assertTrue(all(x["soldPriceVerified"] is False for x in snap["items"]))

    def test_failed_fetch_never_overwrites_existing_file(self):
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / "signals.json"
            path.write_text('{"previous":true}', encoding="utf8")
            def fails(path):
                raise OSError("source unavailable")
            with self.assertRaises(OSError):
                snapshot = collector.build_snapshot(fetcher=fails, pause=lambda _: None)
                collector.save_snapshot(snapshot, path)
            self.assertEqual(path.read_text("utf8"), '{"previous":true}')


if __name__ == "__main__":
    unittest.main()
