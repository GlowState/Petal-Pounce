# Google Play launch checklist

## Already prepared

- [x] Permanent package ID: `com.glowstate.petalpounce`
- [x] Version 1.0.0 / version code 1
- [x] Android 16 / API 36 target
- [x] Offline native Android shell
- [x] No app permissions
- [x] No ads, analytics, accounts, or tracking
- [x] Local-only saved progress and flower unlocks
- [x] Android launcher/adaptive icons
- [x] 1024×500 feature graphic
- [x] Store listing copy
- [x] Data safety draft
- [x] Content-rating notes
- [x] In-app privacy-policy access
- [x] Automated debug and signed-release AAB workflow

## Publisher steps still required

- [ ] Connect the private GlowState GitHub repository and run the Android build workflow.
- [ ] Complete professional trademark/name clearance for **Petal Pounce** before investing in launch marketing. A basic public-web check is not legal clearance.
- [ ] Choose Play Console personal vs. organization account and complete identity verification.
- [ ] Create the Play payments profile using the legal publisher name, physical address, support email, and bank details.
- [ ] Create the app in Play Console using the exact package ID before uploading the first bundle.
- [ ] Set the app to **paid** and enter **$1.99** before launch. Do not launch it free first; Google does not allow a free app to become paid later under the same package ID.
- [ ] Generate an upload keystore, enroll in Play App Signing, and store the four signing values only as private GitHub environment secrets.
- [ ] Publish the privacy page at a public, globally accessible HTTPS URL and add the publisher support email to the policy/listing.
- [ ] Capture at least two screenshots from the actual Android build.
- [ ] Complete App access, Ads, Target audience, Content rating, Data safety, and Government apps declarations.
- [ ] Upload the AAB to Internal testing and test on at least one small phone, one tall phone, and one tablet/foldable layout.
- [ ] If using a personal developer account created after November 13, 2023, run a closed test with at least 12 opted-in testers continuously for 14 days before applying for production access.
- [ ] Verify pricing/countries, tax settings, customer support contact, and refund/support process.
- [ ] Submit production release only after all Play Console checks are green.

## Signing secrets expected by GitHub Actions

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit the `.jks` file or any password to GitHub.
