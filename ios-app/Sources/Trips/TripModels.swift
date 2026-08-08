import Foundation

struct Trip: Codable, Identifiable, Hashable {
    let id: Int
    let userId: Int
    let title: String
    let description: String?
    let startDate: String?
    let endDate: String?
    let currency: String
    let coverImage: String?
    let isArchived: Int
    let reminderDays: Int
    let dayCount: Int?
    let placeCount: Int?
    let isOwner: Int?
    let ownerUsername: String?
    let sharedCount: Int?

    enum CodingKeys: String, CodingKey {
        case id, title, description, currency
        case userId = "user_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case coverImage = "cover_image"
        case isArchived = "is_archived"
        case reminderDays = "reminder_days"
        case dayCount = "day_count"
        case placeCount = "place_count"
        case isOwner = "is_owner"
        case ownerUsername = "owner_username"
        case sharedCount = "shared_count"
    }
}

struct TripDay: Codable, Identifiable, Hashable {
    let id: Int
    let tripId: Int
    let dayNumber: Int?
    let date: String?
    let title: String?
    let notes: String?
    let notesItems: [TripDayNote]?

    enum CodingKeys: String, CodingKey {
        case id, date, title, notes
        case tripId = "trip_id"
        case dayNumber = "day_number"
        case notesItems = "notes_items"
    }
}

struct TripDayNote: Codable, Identifiable, Hashable {
    let id: Int
    let dayId: Int
    let text: String
    let time: String?
    let icon: String?

    enum CodingKeys: String, CodingKey {
        case id, text, time, icon
        case dayId = "day_id"
    }
}

struct TripPlace: Codable, Identifiable, Hashable {
    let id: Int
    let tripId: Int
    let name: String
    let description: String?
    let lat: Double?
    let lng: Double?
    let address: String?
    let price: Double?
    let currency: String?
    let imageURL: String?
    let website: String?
    let phone: String?

    enum CodingKeys: String, CodingKey {
        case id, name, description, lat, lng, address, price, currency, website, phone
        case tripId = "trip_id"
        case imageURL = "image_url"
    }
}

struct TripReservation: Codable, Identifiable, Hashable {
    let id: Int
    let tripId: Int
    let title: String
    let type: String
    let status: String
    let reservationTime: String?
    let reservationEndTime: String?
    let location: String?
    let confirmationNumber: String?
    let notes: String?
    let url: String?

    enum CodingKeys: String, CodingKey {
        case id, title, type, status, location, notes, url
        case tripId = "trip_id"
        case reservationTime = "reservation_time"
        case reservationEndTime = "reservation_end_time"
        case confirmationNumber = "confirmation_number"
    }
}

struct TripsEnvelope: Decodable { let trips: [Trip] }
struct TripEnvelope: Decodable { let trip: Trip }
struct DayEnvelope: Decodable { let day: TripDay }
struct PlacesEnvelope: Decodable { let places: [TripPlace] }
struct ReservationsEnvelope: Decodable { let reservations: [TripReservation] }

struct CreateTripRequest: Encodable {
    let title: String
    let description: String?
    let startDate: String?
    let endDate: String?
    let currency: String?
    let dayCount: Int?

    enum CodingKeys: String, CodingKey {
        case title, description, currency
        case startDate = "start_date"
        case endDate = "end_date"
        case dayCount = "day_count"
    }
}

struct CreateDayRequest: Encodable {
    let date: String?
    let notes: String?
    let position: Int?

    init(date: String? = nil, notes: String? = nil, position: Int? = nil) {
        self.date = date
        self.notes = notes
        self.position = position
    }
}
