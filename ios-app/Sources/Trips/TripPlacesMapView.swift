import MapKit
import SwiftUI

struct TripPlacesMapView: View {
    let places: [TripPlace]
    @State private var position: MapCameraPosition = .automatic

    private var mappedPlaces: [TripPlace] {
        places.filter { $0.lat != nil && $0.lng != nil }
    }

    var body: some View {
        Group {
            if mappedPlaces.isEmpty {
                ContentUnavailableView(
                    "No mapped places",
                    systemImage: "map",
                    description: Text("Add coordinates to saved places to see them here.")
                )
            } else {
                Map(position: $position) {
                    ForEach(mappedPlaces) { place in
                        if let lat = place.lat, let lng = place.lng {
                            Marker(place.name, coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng))
                                .tint(.blue)
                        }
                    }
                }
                .mapControls {
                    MapCompass()
                    MapScaleView()
                }
            }
        }
        .navigationTitle("Trip map")
        .navigationBarTitleDisplayMode(.inline)
    }
}
