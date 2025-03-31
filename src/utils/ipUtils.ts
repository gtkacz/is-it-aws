// Convert an IPv4 address into a number
export function ipToNumber(ip: string): number {
	return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// Check if an IPv4 address is within a given CIDR range
export function isIpInCidr(ip: string, cidr: string): boolean {
	const [range, bitsStr] = cidr.split('/');
	const bits = parseInt(bitsStr, 10);
	const ipNum = ipToNumber(ip);
	const rangeNum = ipToNumber(range);
	const mask = ~(2 ** (32 - bits) - 1) >>> 0;
	return (ipNum & mask) === (rangeNum & mask);
}
