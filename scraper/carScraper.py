import os
import re
import json
import asyncio
import re
import aiohttp
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from interfaces.base_scraper import BaseScraper
from datetime import datetime
from utils.LoggerConstants import SCRAPER_LOGGER
from urllib.parse import urljoin
import time


class carScraper(BaseScraper):
    def __init__(self, proxies=None, request_delay=0.1):
        super().__init__(
            base_url="https://www.pakwheels.com/",
            logger_name=SCRAPER_LOGGER,
            proxies=proxies,
            request_delay=request_delay
        )
        self.module_dir = os.path.dirname(os.path.abspath(__file__))
        self.all_product_links_ = []

    async def get_unique_urls_from_file(self, filename):
        if not isinstance(filename, str) or not filename.strip():
            raise ValueError("Filename must be a non-empty string.")
        
        filepath = os.path.join(self.module_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"The file '{filename}' does not exist.")
        
        with open(filepath, 'r') as file:
            return list(set(line.strip() for line in file if line.strip()))

    async def scrape_products_links(self, url, brand_name=None):
                """
                Scrapes car data from a manufacturer page.
                Returns a dictionary with three categories: new_cars, upcoming_cars, discontinued_cars
                """
                all_data = {
                    'new_cars': [],
                    'upcoming_cars': [],
                    'discontinued_cars': []
                }
                
                try:
                    self.log_info(f"Scraping URL: {url}")
                    response = await self.async_make_request(url)
                    soup = BeautifulSoup(response.text, 'html.parser')

                    # Scrape New Cars - find section that contains "new" in h2
                    new_cars_section = soup.find('h2', string=lambda text: text and 'new' in text.lower() and 'car' in text.lower())
                    if new_cars_section:
                        new_cars_container = new_cars_section.find_next('div', class_='generic-car-widgets-container')
                        if new_cars_container:
                            car_cards = new_cars_container.find_all('li', class_='col-md-3')
                            for card in car_cards:
                                car_data = self._extract_car_data(card, brand_name)
                                if car_data:
                                    all_data['new_cars'].append(car_data)
                    
                    # Scrape Upcoming Cars
                    upcoming_section = soup.find('h2', string=lambda text: text and 'upcoming' in text.lower())
                    if upcoming_section:
                        upcoming_container = upcoming_section.find_next('div', class_='carousel-inner')
                        if upcoming_container:
                            car_cards = upcoming_container.find_all('li', class_='col-md-3')
                            for card in car_cards:
                                car_data = self._extract_upcoming_car_data(card, brand_name)
                                if car_data:
                                    all_data['upcoming_cars'].append(car_data)
                    
                    # Scrape Discontinued Cars
                    discontinued_section = soup.find('h2', string=lambda text: text and 'discontinued' in text.lower())
                    if discontinued_section:
                        discontinued_container = discontinued_section.find_next('div', class_='generic-car-widgets-container')
                        if discontinued_container:
                            car_cards = discontinued_container.find_all('li', class_='col-md-3')
                            for card in car_cards:
                                car_data = self._extract_car_data(card, brand_name)
                                if car_data:
                                    all_data['discontinued_cars'].append(car_data)
                    
                    self.log_info(f"Scraped {len(all_data['new_cars'])} new cars, {len(all_data['upcoming_cars'])} upcoming cars, {len(all_data['discontinued_cars'])} discontinued cars")

                except Exception as e:
                    self.log_error(f"Error scraping page: {e}")

                return all_data
    
    def _extract_car_data(self, card, brand_name=None):
        """Extract car data from a regular car card"""
        try:
            car_info = {}
            
            # Car name
            name_tag = card.find('h3', class_='nomargin truncate')
            car_info['name'] = name_tag.get_text(strip=True) if name_tag else None
            
            # Model name (without brand)
            if car_info['name'] and brand_name:
                # Remove brand name from the full name
                model = car_info['name'].replace(brand_name, '').strip()
                car_info['model'] = model if model else car_info['name']
            else:
                car_info['model'] = car_info['name']
            
            # Image
            img_tag = card.find('img', class_='lazy pic')
            if img_tag:
                img_src = img_tag.get('data-original') or img_tag.get('src')
                car_info['image'] = img_src if img_src and not img_src.startswith('data:') else None
            else:
                car_info['image'] = None
            
            # Price range
            price_tag = card.find('div', class_='generic-green truncate fs14')
            car_info['price_range'] = price_tag.get_text(strip=True) if price_tag else None
            
            # Reviews count
            reviews_tag = card.find('span', class_='generic-gray')
            if reviews_tag:
                reviews_text = reviews_tag.get_text(strip=True)
                # Extract number from "238 Reviews"
                reviews_match = re.search(r'(\d+)\s*Reviews?', reviews_text, re.IGNORECASE)
                car_info['reviews'] = int(reviews_match.group(1)) if reviews_match else None
            else:
                car_info['reviews'] = None
            
            # Link
            link_tag = card.find('a', class_='show')
            if link_tag and link_tag.get('href'):
                href = link_tag.get('href')
                car_info['link'] = urljoin(self.base_url, href)
            else:
                car_info['link'] = None
            
            return car_info
        except Exception as e:
            self.log_debug(f"Error extracting car data: {e}")
            return None
    
    def _extract_upcoming_car_data(self, card, brand_name=None):
        """Extract car data from an upcoming car card"""
        try:
            car_info = {}
            
            # Car name
            name_tag = card.find('h3', class_='nomargin truncate')
            car_info['name'] = name_tag.get_text(strip=True) if name_tag else None
            
            # Model name (without brand)
            if car_info['name'] and brand_name:
                # Remove brand name and year from the full name
                model = car_info['name']
                # Remove year (e.g., "2026")
                model = re.sub(r'\b\d{4}\b', '', model).strip()
                # Remove brand name
                model = model.replace(brand_name, '').strip()
                car_info['model'] = model if model else car_info['name']
            else:
                car_info['model'] = car_info['name']
            
            # Image
            img_tag = card.find('img', class_='lazy-tab pic')
            if img_tag:
                img_src = img_tag.get('data-original') or img_tag.get('src')
                car_info['image'] = img_src if img_src and not img_src.startswith('data:') else None
            else:
                car_info['image'] = None
            
            # Price range (usually "Call For Price")
            price_tag = card.find('div', class_='generic-green truncate fs14')
            car_info['price_range'] = price_tag.get_text(strip=True) if price_tag else None
            
            # Reviews - upcoming cars usually don't have reviews
            car_info['reviews'] = None
            
            # Link
            link_tag = card.find('a', class_='show')
            if link_tag and link_tag.get('href'):
                href = link_tag.get('href')
                car_info['link'] = urljoin(self.base_url, href)
            else:
                car_info['link'] = None
            
            return car_info
        except Exception as e:
            self.log_debug(f"Error extracting upcoming car data: {e}")
            return None
        
    
    async def scrape_category(self, url, brand_name=None):
            """Scrape a category URL and return all car data"""
            car_data = await self.scrape_products_links(url, brand_name)
            return car_data
        
    async def scrape_car_details(self, car_link, brand_name, model_name, car_info, status):
        """Scrape detailed specifications from a car's detail page"""
        try:
            self.log_info(f"Scraping details for {brand_name} {model_name}")
            response = await self.async_make_request(car_link)
            
            if not response or not response.text:
                self.log_error(f"Empty response for {brand_name} {model_name}")
                return None
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            car_specs = {
                'name': car_info.get('name'),
                'brand': brand_name,
                'model': model_name,
                'status': status,
                'image': car_info.get('image'),
                'price_range': car_info.get('price_range'),
                'reviews': car_info.get('reviews'),
                'link': car_link,
                'specifications': {},
                'variants': []
            }
            
            # Scrape specifications table
            try:
                specs_table = soup.find('table', class_='bike-version-detailscont')
                if specs_table:
                    rows = specs_table.find_all('tr')
                    for row in rows:
                        cells = row.find_all('td')
                        if len(cells) == 2:
                            key = cells[0].get_text(strip=True)
                            value = cells[1].get_text(strip=True)
                            car_specs['specifications'][key] = value
                    self.log_info(f"Extracted {len(car_specs['specifications'])} specifications for {model_name}")
                else:
                    self.log_warning(f"No specifications table found for {brand_name} {model_name}")
            except Exception as e:
                self.log_error(f"Error scraping specifications for {brand_name} {model_name}: {str(e)}")
            
            # Scrape variants from price table
            try:
                price_tables = soup.find_all('table', class_='table-bordered')
                self.log_debug(f"Found {len(price_tables)} price tables for {model_name}")
                
                if not price_tables:
                    self.log_warning(f"No price tables with class 'table-bordered' found for {model_name}. Trying alternative table selectors...")
                    # Try alternative selectors
                    price_tables = soup.find_all('table', class_='table-striped')
                    if price_tables:
                        self.log_info(f"Found {len(price_tables)} striped tables for {model_name}")
                
                for table_idx, table in enumerate(price_tables):
                    try:
                        rows = table.find_all('tr')
                        self.log_debug(f"Table {table_idx}: Found {len(rows)} rows")
                        
                        for row_idx, row in enumerate(rows):
                            try:
                                # Look for variant name in h3 tag with link
                                variant_link_tag = row.find('a', class_='show')
                                if variant_link_tag:
                                    variant_h3 = variant_link_tag.find('h3')
                                    if variant_h3:
                                        variant_name = variant_h3.get_text(strip=True)
                                        variant_link = variant_link_tag.get('href', '')
                                        
                                        # Get price from the next td
                                        cells = row.find_all('td')
                                        variant_price = None
                                        if len(cells) >= 2:
                                            price_div = cells[1].find('div', class_='generic-green')
                                            if price_div:
                                                variant_price = price_div.get_text(strip=True)
                                        
                                        if variant_name and variant_price:
                                            car_specs['variants'].append({
                                                'name': variant_name,
                                                'price': variant_price,
                                                'link': variant_link if variant_link else None
                                            })
                                            self.log_debug(f"Extracted variant: {variant_name} - {variant_price}")
                                        else:
                                            self.log_debug(f"Row {row_idx}: Missing variant_name or variant_price (name={variant_name}, price={variant_price})")
                            except Exception as e:
                                self.log_debug(f"Error extracting variant from row {row_idx}: {str(e)}")
                                continue
                    except Exception as e:
                        self.log_error(f"Error processing price table {table_idx} for {model_name}: {str(e)}")
                        continue
                
                self.log_info(f"Extracted {len(car_specs['variants'])} variants for {model_name}")
                if not car_specs['variants']:
                    self.log_warning(f"No variants found for {brand_name} {model_name} - variant list is empty")
                    
            except Exception as e:
                self.log_error(f"Error scraping variants for {brand_name} {model_name}: {str(e)}")
            
            # Log summary
            self.log_info(f"Completed scraping for {brand_name} {model_name}: {len(car_specs['specifications'])} specs, {len(car_specs['variants'])} variants")
            
            return car_specs
            
        except Exception as e:
            self.log_error(f"Error scraping car details for {brand_name} {model_name}: {str(e)}")
            # Return basic structure even on error so we don't lose the car completely
            return {
                'name': car_info.get('name'),
                'brand': brand_name,
                'model': model_name,
                'status': status,
                'image': car_info.get('image'),
                'price_range': car_info.get('price_range'),
                'reviews': car_info.get('reviews'),
                'link': car_link,
                'specifications': {},
                'variants': []
            }

    async def scrape_data(self):
            """Main scraping method that processes all categories and saves JSON files"""
            try:
                # Create necessary folders
                base_dir = os.path.dirname(self.module_dir)
                brands_folder = os.path.join(base_dir, 'brands')
                cars_folder = os.path.join(base_dir, 'cars')
                
                os.makedirs(brands_folder, exist_ok=True)
                os.makedirs(cars_folder, exist_ok=True)
                
                category_urls = await self.get_unique_urls_from_file("categories.txt")
                self.log_info(f"Found {len(category_urls)} category URLs")
                
                first_detail_saved = False
                
                for url in category_urls:
                    try:
                        # Extract manufacturer name from URL (e.g., suzuki, toyota)
                        url_parts = url.rstrip('/').split('/')
                        manufacturer = url_parts[-1] if url_parts else 'unknown'
                        brand_name = manufacturer.capitalize()
                        
                        self.log_info(f"Processing {manufacturer}...")
                        
                        # Scrape the category
                        car_data = await self.scrape_category(url, brand_name)
                        
                        # Save brand JSON to brands folder
                        json_filename = f"{manufacturer}.json"
                        json_path = os.path.join(brands_folder, json_filename)
                        
                        if os.path.exists(json_path):
                            os.remove(json_path)
                            self.log_info(f"Deleted existing file: {json_filename}")
                        
                        with open(json_path, 'w', encoding='utf-8') as f:
                            json.dump(car_data, f, indent=2, ensure_ascii=False)
                        
                        self.log_info(f"Saved {manufacturer} data to brands/{json_filename}")
                        self.log_info(f"  - New cars: {len(car_data['new_cars'])}")
                        self.log_info(f"  - Upcoming cars: {len(car_data['upcoming_cars'])}")
                        self.log_info(f"  - Discontinued cars: {len(car_data['discontinued_cars'])}")
                        
                        # Create brand folder inside cars folder
                        brand_cars_folder = os.path.join(cars_folder, manufacturer)
                        os.makedirs(brand_cars_folder, exist_ok=True)
                        
                        # Scrape details for each car with status tracking
                        car_categories = [
                            (car_data['new_cars'], 'new'),
                            (car_data['upcoming_cars'], 'upcoming'),
                            (car_data['discontinued_cars'], 'discontinued')
                        ]
                        
                        for cars_list, status in car_categories:
                            for car in cars_list:
                                if car.get('link'):
                                    # Save first one as HTML for reference
                                    if not first_detail_saved:
                                        try:
                                            detail_response = await self.async_make_request(car['link'])
                                            # detail_html_path = os.path.join(base_dir, 'car_detail_page.html')
                                            # with open(detail_html_path, 'w', encoding='utf-8') as f:
                                            #     f.write(detail_response.text)
                                            # self.log_info(f"Saved detail page HTML to car_detail_page.html")
                                            first_detail_saved = True
                                        except Exception as e:
                                            self.log_error(f"Error saving detail HTML: {str(e)}")
                                    
                                    # Scrape car details
                                    model_name = car.get('model', 'unknown')
                                    car_specs = await self.scrape_car_details(car['link'], brand_name, model_name, car, status)
                                
                                if car_specs:
                                    # Save car specs to cars/brand/model.json
                                    car_filename = f"{model_name.replace(' ', '_').lower()}.json"
                                    car_json_path = os.path.join(brand_cars_folder, car_filename)
                                    
                                    if os.path.exists(car_json_path):
                                        os.remove(car_json_path)
                                    
                                    with open(car_json_path, 'w', encoding='utf-8') as f:
                                        json.dump(car_specs, f, indent=2, ensure_ascii=False)
                                    
                                    self.log_info(f"Saved {model_name} specifications to cars/{manufacturer}/{car_filename}")
                        
                    except Exception as e:
                        self.log_error(f"Error processing {url}: {str(e)}")
                        continue
                
                self.log_info("Scraping completed!")
                
            except Exception as e:
                self.log_error(f"Scraping failed: {str(e)}")