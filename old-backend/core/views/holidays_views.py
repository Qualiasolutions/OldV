"""Views relating to holidays"""

from typing import Dict, List, TypedDict
import pycountry # type: ignore
from slugify import slugify
import holidays as pyholidays
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.utils import holidays

@api_view(["GET"])
def get_countries(request):
    """Get all supported countries"""
    codes = pyholidays.list_supported_countries().keys()
    return Response([{
        "code": code,
        "name": pycountry.countries.get(alpha_2=code).name
    } for code in codes], status.HTTP_200_OK)


class Holiday(TypedDict):
    """Holiday"""
    name: str
    start_date: str
    end_date: str
    id: str
    country_code: str

@api_view(["GET"])
def get_holidays(request):
    """Get the holidays for the countries requested"""
    country_codes = request.GET.getlist("country_codes")
    years = [int(year) for year in request.GET.getlist("years")] or holidays.country_holidays["GB"].keys()

    country_holidays: Dict[str, List[Holiday]] = {}
    for code in country_codes:
        country_holidays[code] = [
            {
                "name": holiday_name,
                "start_date": date.strftime("%Y-%m-%d"),
                "end_date": date.strftime("%Y-%m-%d"),
                "id": f"{code}_{date}_{slugify(holiday_name)}",
                "country_code": code
            }
            for date, holiday_name in pyholidays.country_holidays(code, years=years).items()
        ]
        for year in years:
            if holidays.country_holidays.get(code):
                extra_holidays = holidays.country_holidays[code].get(year)
                if extra_holidays:
                    country_holidays[code] += [
                        {
                            **hol, # type: ignore
                            "country_code": code
                        } for hol in extra_holidays
                    ]

        country_holidays[code].sort(key=lambda x: x["start_date"])

    return Response(country_holidays, status.HTTP_200_OK)
