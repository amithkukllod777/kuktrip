package com.kuklabs.kuktrip.ui.maps

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kuklabs.kuktrip.data.trips.Place
import org.maplibre.compose.expressions.dsl.const
import org.maplibre.compose.layers.CircleLayer
import org.maplibre.compose.map.MaplibreMap
import org.maplibre.compose.sources.GeoJsonData
import org.maplibre.compose.sources.rememberGeoJsonSource
import org.maplibre.compose.style.BaseStyle

@Composable
fun TripMapScreen(
    places: List<Place>,
    modifier: Modifier = Modifier,
) {
    val mapped = remember(places) { places.filter { it.lat != null && it.lng != null } }
    val geoJson = remember(mapped) {
        buildString {
            append("{\"type\":\"FeatureCollection\",\"features\":[")
            mapped.forEachIndexed { index, place ->
                if (index > 0) append(',')
                val safeName = place.name.replace("\\", "\\\\").replace("\"", "\\\"")
                append("{\"type\":\"Feature\",\"geometry\":{\"type\":\"Point\",\"coordinates\":[")
                append(place.lng)
                append(',')
                append(place.lat)
                append("]},\"properties\":{\"id\":")
                append(place.id)
                append(",\"name\":\"")
                append(safeName)
                append("\"}}")
            }
            append("]}")
        }
    }

    Box(modifier.fillMaxSize()) {
        MaplibreMap(
            modifier = Modifier.fillMaxSize(),
            baseStyle = BaseStyle.Uri("https://tiles.openfreemap.org/styles/liberty"),
        ) {
            val source = rememberGeoJsonSource(GeoJsonData.JsonString(geoJson))
            CircleLayer(
                id = "kuktrip-places",
                source = source,
                radius = const(8.dp),
                color = const(Color(0xFF2563EB)),
                strokeColor = const(Color.White),
                strokeWidth = const(2.dp),
            )
        }

        if (mapped.isEmpty()) {
            Card(Modifier.padding(16.dp)) {
                Text(
                    "Add coordinates to saved places to see them on the map.",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(14.dp),
                )
            }
        }
    }
}
