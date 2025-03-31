<template>
	<img v-if="provider === 'flagpedia'" :src="`https://flagcdn.com/${width}x${height}/${country.toLowerCase()}.png`" :height="height"
		:width="width" :alt="country">

	<img v-else-if="provider === 'flagsapi'" :src="`https://flagsapi.com/${country}/${style}/${width}.png`"
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
			default: 'shiny'
		}
	},
	computed: {
		country() {
			return this.countryCode.toUpperCase();
		},
		height() {
			return this.width / (4 / 3);
		},
	},
});
</script>

<style lang="scss" scoped></style>