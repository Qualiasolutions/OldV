from typing import TypedDict


class Holiday(TypedDict):
    """Holiday"""
    id: str
    name: str
    start_date: str
    end_date: str
