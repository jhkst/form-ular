/**
 * Implementation of Date and DateTime without dependency on js Date and without dependency on timezone
 */

class FDate {

    constructor(year = 1979, month = 1, day = 1) {
        this.year = year;
        this.month = month;
        this.day = day;
    }

    static parse(val) {
        let match = FDate._parseMatch(val)
        return new FDate(
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10)
        );
    }

    static isParsable(val) {
        return val != null && FDate._parseMatch(val) != null;
    }

    static _parseMatch(val) {
        //yyyy-mm-dd
        return val.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2}).*/);
    }

    static isFDate(obj) {
        return obj != null && obj.constructor === FDate;
    }

    static _pad0(number, len) {
        return number.toString().padStart(len, '0');
    }

    toString() {
        return FDate._pad0(this.year, 4) +
            '-' + FDate._pad0(this.month, 2) +
            '-' + FDate._pad0(this.day, 2);
    }

    toDate() {
        return this;
    }

    toLocaleString(locale) {
        switch (locale) {
            case 'cs-CZ':
                return `${this.day}.${this.month}.${this.year}`;
            default:
                return this.toString();
        }
    }

}

class FDateTime extends FDate {

    constructor(year = 1979, month = 1, day = 1, hour = 0, minute = 0, second = 0) {
        super(year, month, day);
        this.hour = hour;
        this.minute = minute;
        this.second = second;
    }

    static isFDateTime(obj) {
        return obj != null && obj.constructor === FDateTime;
    }

    static parse(val) {
        let match = FDateTime._parseMatch(val);
        return new FDateTime(
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            parseInt(match[4], 10),
            parseInt(match[5], 10),
            match[6] ? parseInt(match[6], 10) : 0
        );

    }

    static isParsable(val) {
        return val != null && FDateTime._parseMatch(val) != null;
    }

    static _parseMatch(val) {
        //yyyy-mm-ddThh:MM:ss
        return val.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})[T ]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?.*/);
    }

    toDate() {
        return new FDate(this.year, this.month, this.day);
    }

    toString() {
        return FDate._pad0(this.year, 4) +
            '-' + FDate._pad0(this.month, 2) +
            '-' + FDate._pad0(this.day, 2) +
            'T' + FDate._pad0(this.hour, 2) +
            ':' + FDate._pad0(this.minute, 2) +
            ':' + FDate._pad0(this.second, 2);
     }

    toLocaleString(locale) {
        switch (locale) {
            case 'cs-CZ':
                return `${this.day}.${this.month}.${this.year} ${Date._pad0(this.hour)}:${Date._pad0(this.minute)}:${Date._pad0(this.second)}`;
            default:
                return this.toString();
        }
    }

}

