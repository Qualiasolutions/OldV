"""Categories"""

from enum import Enum


class Categories(Enum):
    """Categories"""

    PETS = 1
    SOCIAL_INTERESTS = 2
    EDUCATION = 3
    CAREER = 4
    TRAVEL = 5
    HEALTH_BEAUTY = 6
    HOME = 7
    GARDEN = 8
    FOOD = 9
    LAUNDRY = 10
    FINANCE = 11
    TRANSPORT = 12


CATEGORY_READABLE_NAMES = {
    Categories.PETS: "Pets",
    Categories.SOCIAL_INTERESTS: "Social",
    Categories.EDUCATION: "Education",
    Categories.CAREER: "Career",
    Categories.TRAVEL: "Travel",
    Categories.HEALTH_BEAUTY: "Health & Beauty",
    Categories.HOME: "Home",
    Categories.GARDEN: "Garden",
    Categories.FOOD: "Food",
    Categories.LAUNDRY: "Laundry",
    Categories.FINANCE: "Finance",
    Categories.TRANSPORT: "Transport",
}


class CategorySettings:
    """CategorySettings"""

    def __init__(self, id, is_enabled=True, is_premium=False):
        self.id = id
        self.name = Categories(id).name
        self.readable_name = CATEGORY_READABLE_NAMES[Categories(id)]
        self.is_enabled = is_enabled
        self.is_premium = is_premium


CATEGORY_SETTINGS = {
    Categories.HEALTH_BEAUTY: CategorySettings(6, is_premium=True),
}


def get_category_settings(category_id):
    """get_category_settings"""
    category_id_int = int(category_id)
    if Categories(category_id_int) in CATEGORY_SETTINGS:
        return CATEGORY_SETTINGS.get(Categories(category_id_int))
    return CategorySettings(category_id_int)
