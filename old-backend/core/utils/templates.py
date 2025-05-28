"""Template utils"""
from typing import Dict, List, TypedDict

from core.utils.categories import Categories


class TemplateSettings(TypedDict):
    """TemplateSettings"""

    content: Dict[str, List[str]]
    name: str
    category: int


PLANNING_LIST_TEMPLATES: Dict[str, TemplateSettings] = {
    "BEFORE_AFTER_TERM_TIME": {
        "category": Categories.EDUCATION.value,
        "name": "Before and after Term Time",
        "content": {
            "Before school starts": ["Clothes/uniforms/shoes", "Buy Stationary"],
            "Before holiday school break": [
                "Buy teacher gifts, wrap or write cards time with the kids "
            ],
            "Before each school break": ["List trips, camps , childcare or activities"],
            "Before school ends": [
                "List trips, camps , childcare, activities and/or summer work"
            ],
            "When school ends": [
                "Buy teacher gifts",
                "Clean out book bags and school work",
                "Take uniform to the dry cleaners",
                "File school reports",
            ],
        },
    },
    "PLAN_TRIP": {
        "category": Categories.TRAVEL.value,
        "name": "Planning my Trip",
        "content": {
            "What to think about": [
                "Flights",
                "Cars",
                "Hotels",
                "Activities",
                "Research",
                "Book anything ahead?",
                "What to pack",
                "What to buy",
            ],
        },
    },
    "PACKING_LIST": {
        "category": Categories.TRAVEL.value,
        "name": "Packing List",
        "content": {
            "Clothes": [],
            "Electronics": [],
            "Medicines": [],
            "Documentation and ID": [],
            "Personal Hygiene (Face, hair, body)": [],
        },
    },
    "PLAN_BIRTHDAY_ANNIVERSARY": {
        "category": Categories.SOCIAL_INTERESTS.value,
        "name": "Celebrating Birthdays and Anniversaries",
        "content": {
            "Dinner(s) or Activit-ies planned": [],
            "Cake": ["Cake", "Candles"],
            "Gift": [
                "Gift ideas",
                "Buy a gift",
                "Wrapping paper",
                "Wrap present",
                "Deliver present",
            ],
            "Decorations": [
                "Find decorations at home or buy",
                "Put up decorations",
                "Take down decorations",
                "Store decorations",
            ],
        },
    },
    "PLAN_HOLIDAY": {
        "category": Categories.SOCIAL_INTERESTS.value,
        "name": "Celebrating Holidays",
        "content": {
            "Dinner(s) or Activit-ies planned": [],
            "Gift": [
                "Gift ideas",
                "Buy a gift",
                "Wrapping paper",
                "Wrap present",
                "Deliver present",
            ],
            "Decorations": [
                "Find decorations at home",
                "Put up decorations",
                "Take down decorations",
                "Store decorations",
            ],
        },
    },
    "PLAN_EVENT": {
        "category": Categories.SOCIAL_INTERESTS.value,
        "name": "Plan Event",
        "content": {
            "Find Date for Event": ["List potential date(s) here"],
            "Find Location": ["List potential location(s) here"],
            "Activity planning during the event": [
                "Welcome drink",
                "Sit down meal",
                "Speech at 9:00pm",
                "Goodbyes at 11:00pm",
            ],
            "Food and Menu planning": [],
            "Decorations": [
                "Find decorations at home",
                "Put up decorations",
                "Take down decorations",
                "Store decorations",
            ],
            "Party favours": [],
            "Gift": [
                "Gift ideas",
                "Buy a gift",
                "Wrapping paper",
                "Wrap present",
                "Deliver present",
            ],
            "Music": ["Playlist or DJ"],
        },
    },
}
