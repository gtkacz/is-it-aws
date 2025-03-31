<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="8" class="mx-auto">
            <v-card class="mt-4">
              <v-card-title class="text-h5">AWS IP Checker</v-card-title>
              <v-card-text>
                <v-form @submit.prevent="checkIP">
                  <v-text-field
                    v-model="ipAddress"
                    label="Enter IP Address"
                    :rules="[rules.required, rules.ipFormat]"
                    placeholder="e.g. 52.94.76.5"
                  ></v-text-field>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="loading"
                    :disabled="!ipAddress"
                  >
                    Check IP
                  </v-btn>
                </v-form>

                <v-alert
                  v-if="result"
                  :color="isAWSIP ? 'success' : 'error'"
                  :icon="isAWSIP ? 'mdi-check-circle' : 'mdi-alert-circle'"
                  class="mt-4"
                >
                  {{ result }}
                </v-alert>

                <div v-if="isAWSIP && location" class="mt-4">
                  <v-card-title class="text-h6">Location Details</v-card-title>
                  <v-list>
                    <v-list-item>
                      <v-list-item-title>Region: {{ location.region }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>City: {{ location.city }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Country: {{ location.country }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </div>

                <div v-if="isAWSIP && location" ref="mapContainer" class="map-container mt-4"></div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import IPCIDR from 'ip-cidr'
import L from 'leaflet'
import getLocationDetails from './util/getLocationDetails';

const ipAddress = ref('')
const loading = ref(false)
const result = ref('')
const isAWSIP = ref(false)
const location = ref<any>(null)
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null

const rules = {
  required: (value: string) => !!value || 'IP address is required',
  ipFormat: (value: string) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    return ipRegex.test(value) || 'Invalid IP address format'
  }
}

const checkIP = async () => {
  loading.value = true
  isAWSIP.value = false
  location.value = null
  result.value = ''

  try {
    const response = await fetch('/data/ip-ranges.json')
    const data = await response.json()
    
    const matchingPrefix = data.prefixes.find((prefix: any) => {
      try {
        const cidr = new IPCIDR(prefix.ip_prefix)
        return cidr.contains(ipAddress.value)
      } catch {
        return false
      }
    })

    if (matchingPrefix) {
      isAWSIP.value = true
      result.value = `This IP belongs to AWS (${matchingPrefix.service})`
      location.value = {
        region: matchingPrefix.region,
        city: getLocationDetails(matchingPrefix.region).city,
        country: getLocationDetails(matchingPrefix.region).country,
        coordinates: getLocationDetails(matchingPrefix.region).coordinates
      }
      
      if (location.value.coordinates) {
        initMap()
      }
    } else {
      result.value = 'This IP does not belong to AWS'
    }
  } catch (error) {
    result.value = 'Error checking IP address'
    console.error(error)
  }

  loading.value = false
}

const initMap = () => {
  if (!location.value?.coordinates || !mapContainer.value) return

  if (map) {
    map.remove()
  }

  map = L.map(mapContainer.value).setView(location.value.coordinates, 10)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  L.marker(location.value.coordinates)
    .addTo(map)
    .bindPopup(`AWS Region: ${location.value.region}<br>City: ${location.value.city}`)
    .openPopup()
}

onMounted(() => {
  // Clean up map on component unmount
  return () => {
    if (map) {
      map.remove()
    }
  }
})
</script>