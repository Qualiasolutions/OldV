"""Define the different tags that can be used
    for different categories
"""

from typing import List, Literal, Tuple

PetTagType = Literal[
    "PETS__FEEDING",
    "PETS__EXERCISE",
    "PETS__GROOMING",
    "PETS__HEALTH",
]

PetTagChoice = Tuple[PetTagType, str]
PetTagChoices = List[PetTagChoice]

PET_TAG_CHOICES: PetTagChoices = [
    ("PETS__FEEDING", "Feeding"),
    ("PETS__EXERCISE", "Exercise"),
    ("PETS__GROOMING", "Grooming"),
    ("PETS__HEALTH", "Health"),
]

PET_TAGS = [choice[0] for choice in PET_TAG_CHOICES]


TagType = PetTagType


INFORMATION_TAG_CHOICES = [
    ("TRANSPORT__INFORMATION__PUBLIC", "Transport public information"),
    ("FINANCE__INFORMATION__PUBLIC", "Finance public information"),
    ("TRAVEL__INFORMATION__PUBLIC", "Travel public information"),
    ("CAREER__INFORMATION__PUBLIC", "Career public information"),
    ("SOCIAL_INTERESTS__INFORMATION__PUBLIC", "Social public information"),
    ("HOME__INFORMATION__PUBLIC", "Home public information"),
    ("GARDEN__INFORMATION__PUBLIC", "Garden public information"),
    ("FOOD__INFORMATION__PUBLIC", "Food public information"),
    ("LAUNDRY__INFORMATION__PUBLIC", "Laundry public information"),
]

ANNIVERSARY_TAG_CHOICES = [
    ("SOCIAL_INTERESTS__BIRTHDAY", "Birthday"),
    ("SOCIAL_INTERESTS__ANNIVERSARY", "Anniversary"),
]


HOLIDAYS_TAG_CHOICES = [("SOCIAL_INTERESTS__HOLIDAY", "Holiday I Celebrate")]


TAG_CHOICES = (
    PET_TAG_CHOICES
    + INFORMATION_TAG_CHOICES
    + ANNIVERSARY_TAG_CHOICES
    + HOLIDAYS_TAG_CHOICES
)
