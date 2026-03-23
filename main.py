import json
import logging.config
import asyncio
from scraper.carScraper import carScraper

def setup_logging():
    with open("utils/logging_config.json") as f:
        config = json.load(f)
    logging.config.dictConfig(config)

setup_logging()
scraper = carScraper()
asyncio.run(scraper.scrape_data())
