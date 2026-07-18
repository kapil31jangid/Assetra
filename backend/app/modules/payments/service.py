from math import ceil


def calculate_late_fee(minutes_late: int, unit: str, amount: float, maximum: float | None = None) -> float:
    if minutes_late <= 0 or amount <= 0:
        return 0.0
    if unit == "daily":
        units = ceil(minutes_late / (24 * 60))
    elif unit == "weekly":
        units = ceil(minutes_late / (7 * 24 * 60))
    elif unit == "monthly":
        units = ceil(minutes_late / (30 * 24 * 60))
    else:
        units = ceil(minutes_late / 60)
    value = float(units * amount)
    return min(value, maximum) if maximum is not None else value
