<template>
	<img v-if="provider === 'flagpedia'" :src="flagpediaUrl" :height="height"
		:width="width" :alt="country">

	<img v-else-if="provider === 'flagsapi'" :src="flagsapiUrl"
		>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'CountryFlag',
	props: {
		provider : {
			type: String,
			required: false,
			default: 'flagsapi'
		},
		countryCode: {
			type: String,
			required: true,
		},
		width: {
			type: Number,
			required: false,
			default: 16
		},
		style: {
			type: String,
			required: false,
			default: 'flat'
		}
	},
	computed: {
		country() {
			return this.countryCode.toUpperCase();
		},
		height() {
			return this.width / (4 / 3);
		},
		flagpediaUrl() {
			switch(this.style) {
				case 'waving':
					return `https://flagcdn.com/${this.width}x${this.height}/${this.country.toLowerCase()}.png`;
				case 'width':
					return `https://flagcdn.com/w${this.width}/${this.country.toLowerCase()}.png`;
				case 'height':
					return `https://flagcdn.com/h${this.height}/${this.country.toLowerCase()}.png`;
				default:
					return `https://flagcdn.com/${this.width}x${this.height}/${this.country.toLowerCase()}.png`;
			}
		},
		flagsapiUrl() {
			return `https://flagsapi.com/${this.country}/${this.style}/${this.width}.png`;
		}
	},
});
</script>

<style lang="scss" scoped></style>