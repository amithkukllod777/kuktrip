import Foundation

struct TripBudgetItem: Codable, Identifiable, Hashable {
    let id: Int
    let tripId: Int
    let category: String
    let name: String
    let totalPrice: Double
    let persons: Int?
    let days: Int?
    let note: String?
    let expenseDate: String?
    let reservationId: Int?

    enum CodingKeys: String, CodingKey {
        case id, category, name, persons, days, note
        case tripId = "trip_id"
        case totalPrice = "total_price"
        case expenseDate = "expense_date"
        case reservationId = "reservation_id"
    }
}

struct BudgetEnvelope: Decodable { let items: [TripBudgetItem] }
struct BudgetItemEnvelope: Decodable { let item: TripBudgetItem }

struct CreateBudgetItemRequest: Encodable {
    let name: String
    let category: String
    let totalPrice: Double
    let persons: Int?
    let days: Int?
    let note: String?
    let expenseDate: String?

    enum CodingKeys: String, CodingKey {
        case name, category, persons, days, note
        case totalPrice = "total_price"
        case expenseDate = "expense_date"
    }
}
