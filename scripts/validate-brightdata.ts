/**
 * BrightData LinkedIn Profile API Validation
 *
 * Tests whether BrightData can return career history data for a LinkedIn profile.
 * Usage: npx tsx scripts/validate-brightdata.ts
 */

const DATASET_ID = "gd_l1viktl72bvl7bjuj0"; // LinkedIn People Profile
// Test with a profile that has public experience data
const TEST_PROFILE = "https://www.linkedin.com/in/satyanadella/";

async function main() {
	const API_KEY = process.env.BRIGHTDATA_API_KEY;
	if (!API_KEY) {
		console.log("\n⚠ SKIPPED — No BRIGHTDATA_API_KEY set in .env.local\n");
		console.log("1. Sign up at https://brightdata.com (free trial)");
		console.log(
			"2. Get API key from Account Settings → API Keys",
		);
		console.log("3. Add BRIGHTDATA_API_KEY=your_key to .env.local");
		process.exit(0);
	}

	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(" BrightData LinkedIn Profile API Validation");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`\nProfile: ${TEST_PROFILE}`);
	console.log(`Dataset: ${DATASET_ID}`);

	// Step 1: Trigger synchronous scrape
	console.log("\n[1/3] Triggering profile scrape (synchronous)...");
	const startTime = Date.now();

	const url = `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${DATASET_ID}&format=json&include_errors=true`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify([{ url: TEST_PROFILE }]),
	});

	const elapsed = Date.now() - startTime;
	console.log(`   Status: ${response.status} (${elapsed}ms)`);

	// Step 2: Handle response
	if (response.status === 200) {
		// Synchronous result
		const data = await response.json();
		console.log("\n[2/3] Got synchronous response");
		analyzeProfile(data);
	} else if (response.status === 202) {
		// Async — need to poll
		const { snapshot_id } = (await response.json()) as { snapshot_id: string };
		console.log(`\n[2/3] Async response — snapshot: ${snapshot_id}`);
		console.log("   Polling for results...");

		const result = await pollForResults(snapshot_id, API_KEY);
		if (result) {
			analyzeProfile(result);
		}
	} else {
		const body = await response.text();
		console.error(`\n✗ API Error: ${response.status}`);
		console.error(body);
		process.exit(1);
	}
}

async function pollForResults(
	snapshotId: string,
	apiKey: string,
	maxAttempts = 30,
	intervalMs = 5000,
): Promise<unknown> {
	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((r) => setTimeout(r, intervalMs));

		// Check progress
		const progressRes = await fetch(
			`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`,
			{
				headers: { Authorization: `Bearer ${apiKey}` },
			},
		);

		if (progressRes.status === 200) {
			const progress = (await progressRes.json()) as { status: string };
			console.log(
				`   Poll ${i + 1}/${maxAttempts}: ${progress.status}`,
			);

			if (progress.status === "ready") {
				// Download results
				const dataRes = await fetch(
					`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
					{
						headers: { Authorization: `Bearer ${apiKey}` },
					},
				);
				return dataRes.json();
			}
		}
	}

	console.error("✗ Timed out waiting for results");
	process.exit(1);
}

function analyzeProfile(data: unknown) {
	console.log("\n[3/3] Analyzing profile data...\n");

	// Write raw response for inspection
	const fs = require("node:fs");
	const outPath = "scripts/brightdata-response.json";
	fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
	console.log(`   Raw response saved to: ${outPath}`);

	const profiles = Array.isArray(data) ? data : [data];
	const profile = profiles[0] as Record<string, unknown>;

	if (!profile) {
		console.error("✗ No profile data returned");
		process.exit(1);
	}

	// Show all top-level keys
	console.log(`\n   Top-level fields (${Object.keys(profile).length}):`);
	for (const key of Object.keys(profile).sort()) {
		const val = profile[key];
		const type = Array.isArray(val)
			? `array[${val.length}]`
			: typeof val === "object" && val !== null
				? `object{${Object.keys(val).length}}`
				: typeof val;
		const preview =
			typeof val === "string"
				? val.slice(0, 60)
				: Array.isArray(val)
					? ""
					: String(val);
		console.log(`   - ${key}: ${type}${preview ? ` = "${preview}"` : ""}`);
	}

	// Check for career/experience data
	const experienceKeys = [
		"experience",
		"positions",
		"job_history",
		"current_company",
		"position",
		"past_companies",
		"member_experience",
	];

	console.log("\n   Career-relevant fields:");
	let hasCareerData = false;
	for (const key of experienceKeys) {
		if (key in profile) {
			hasCareerData = true;
			const val = profile[key];
			if (Array.isArray(val)) {
				console.log(`   ✓ ${key}: ${val.length} entries`);
				// Show first 3 entries
				for (const entry of val.slice(0, 3)) {
					if (typeof entry === "object" && entry !== null) {
						const e = entry as Record<string, unknown>;
						const title = e.title || e.position || e.role || "?";
						const company =
							e.company || e.company_name || e.organization || "?";
						const dates = e.date_range || e.dates || e.duration || "";
						console.log(
							`     → ${title} @ ${company}${dates ? ` (${dates})` : ""}`,
						);
					} else {
						console.log(`     → ${JSON.stringify(entry)}`);
					}
				}
			} else {
				console.log(`   ✓ ${key}: ${JSON.stringify(val)}`);
			}
		}
	}

	if (!hasCareerData) {
		console.log("   ⚠ No career history fields found in response");
		console.log("   Check scripts/brightdata-response.json for full data");
	}

	// Summary
	console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(
		hasCareerData
			? " ✓ VALIDATION PASSED — Career history data available"
			: " ⚠ VALIDATION NEEDS REVIEW — Check raw response",
	);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Load .env.local
require("node:fs")
	.readFileSync(".env.local", "utf8")
	.split("\n")
	.filter((l: string) => l && !l.startsWith("#"))
	.forEach((l: string) => {
		const [k, ...v] = l.split("=");
		if (k && v.length) process.env[k.trim()] = v.join("=").trim();
	});

main().catch((err) => {
	console.error("✗ Unexpected error:", err);
	process.exit(1);
});
