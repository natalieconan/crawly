class Car {
    constructor(ad_id, body_type, 
        brand, color, condition,
        currency, direct_injection, 
        distance, distance_range,
        distance_unit, engine, engine_type,
        engine_unit
    ) {
        this.ad_id = ad_id;
        this.body_type = body_type;
        this.brand = brand;
        this.color = color;
        this.condition = condition;
        this.currency = currency;
        this.direct_injection = direct_injection;
        this.distance = distance;
        this.distance_range = distance_range;
        this.distance_unit = distance_unit;
        this.engine = engine;
        this.engine_type = engine_type;
        this.engine_unit = engine_unit;
    }
}

module.exports = Car;