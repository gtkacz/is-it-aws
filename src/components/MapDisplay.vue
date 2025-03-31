<template>
	<v-progress-linear v-if="loading" indeterminate color="primary" />
	<div ref="mapElement" class="map"></div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch, ref, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default defineComponent({
	name: 'MapDisplay',
	props: {
		city: {
			type: String,
			required: true,
		},
		countryCode: {
			type: String,
			required: true,
		},
		provider: {
			type: String,
			required: false,
			default: 'OpenTopoMap'
		},
	},
	setup(props) {
		const map = ref<L.Map | null>(null);
		const mapElement = ref<HTMLDivElement | null>(null);
		const loading = ref(false);
		let geocodeTimeout: number | null = null;

		const getCoordinates = async (city: string, countryCode: string) => {
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=${encodeURIComponent(countryCode)}&format=json&limit=1`
				);

				const data = await response.json();

				if (data && data.length > 0) {
					return {
						lat: parseFloat(data[0].lat),
						lng: parseFloat(data[0].lon)
					};
				}

				// Default coordinates if city not found
				return { lat: 20, lng: 0 };
			} catch (error) {
				console.error('Error fetching coordinates:', error);
				return { lat: 20, lng: 0 };
			}
		};

		const initializeMap = async () => {
			loading.value = true;

			if (!mapElement.value) return;

			const coords = await getCoordinates(props.city, props.countryCode);

			map.value = L.map(mapElement.value).setView([coords.lat, coords.lng], 5);

			// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			// 	attribution: '&copy; OpenStreetMap contributors'
			// }).provider(props.provider).addTo(map.value);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors'
			}).addTo(map.value);

			L.marker([coords.lat, coords.lng]).addTo(map.value);

			loading.value = false;
		};

		onMounted(() => {
			initializeMap();
		});

		// Cleanup resources when component is unmounted
		onBeforeUnmount(() => {
			if (geocodeTimeout !== null) {
				window.clearTimeout(geocodeTimeout);
			}

			if (map.value) {
				map.value.remove();
				map.value = null;
			}
		});

		// Update map when city or country code props change
		watch([() => props.city, () => props.countryCode], async () => {
			if (map.value) {
				// Clear any pending timeouts
				if (geocodeTimeout !== null) {
					window.clearTimeout(geocodeTimeout);
				}

				loading.value = true;

				// Debounce API calls
				geocodeTimeout = window.setTimeout(async () => {
					const coords = await getCoordinates(props.city, props.countryCode);
					map.value?.setView([coords.lat, coords.lng], 5);

					// Clear all existing markers
					map.value.eachLayer((layer) => {
						if (layer instanceof L.Marker) {
							map.value?.removeLayer(layer);
						}
					});

					// Add new marker
					L.marker([coords.lat, coords.lng]).addTo(map.value);

					loading.value = false;
				}, 300);
			}
		});

		return { mapElement, loading };
	}
});
</script>

<style lang="scss" scoped>
.map {
	width: 100%;
	height: 100%;
}
</style>