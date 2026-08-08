import Foundation
import Observation

@MainActor
@Observable
final class TripsStore {
    var trips: [Trip] = []
    var selectedTrip: Trip?
    var days: [TripDay] = []
    var isLoading = false
    var errorMessage: String?

    private let client = TripClient.shared

    func loadTrips() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do { trips = try await client.listTrips() }
        catch { errorMessage = error.localizedDescription }
    }

    func openTrip(_ trip: Trip) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            async let fresh = client.getTrip(id: trip.id)
            async let itinerary = client.listDays(tripId: trip.id)
            selectedTrip = try await fresh
            days = try await itinerary
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createTrip(title: String, startDate: String?, endDate: String?, dayCount: Int?) async -> Trip? {
        guard !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let trip = try await client.createTrip(
                CreateTripRequest(
                    title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                    description: nil,
                    startDate: startDate?.nilIfBlank,
                    endDate: endDate?.nilIfBlank,
                    currency: nil,
                    dayCount: dayCount
                )
            )
            trips.insert(trip, at: 0)
            selectedTrip = trip
            days = (try? await client.listDays(tripId: trip.id)) ?? []
            return trip
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func addDay() async {
        guard let trip = selectedTrip else { return }
        do { days.append(try await client.addDay(tripId: trip.id)) }
        catch { errorMessage = error.localizedDescription }
    }
}

private extension String {
    var nilIfBlank: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}
