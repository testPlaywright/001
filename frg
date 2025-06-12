
name: Cypress E2E Test Run

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  actions: read

jobs:
  test:
    runs-on: uhg-runner

    environment:
      name: ${{ github.ref_name }}

    steps:
      - name: Cleanup
        run: |
          sudo chown -R $USER:$USER $GITHUB_WORKSPACE

      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20.x

      - name: Installing Cypress Dependencies and xvfb
        if: runner.os == 'Linux'
        run: |
          wget https://repo1.uhc.com/artifactory/security-ubuntu-cache/ubuntu/pool/main/x/xorg-server/xserver-common_21.1.4-2ubuntu1.7~22.04.9_all.deb -O /tmp/xserver-common.deb
          wget https://repo1.uhc.com/artifactory/security-ubuntu-cache/ubuntu/pool/universe/x/xorg-server/xvfb_21.1.3-2ubuntu2.9_amd64.deb -O /tmp/xvfb.deb

          sudo apt-get update
          sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2t64 libxtst6 xauth /tmp/xserver-common.deb /tmp/xvfb.deb

          rm /tmp/xserver-common.deb /tmp/xvfb.deb

      - name: npm Install
        run: |
          npm config set registry https://repo1.uhc.com/artifactory/api/npm/npm-virtual/
          npm install

      - name: Run Cypress Tests
        run: npx cypress run

      - name: Final Summary
        run: echo "✅ Cypress Tests Completed Successfully."

      - name: Upload Cypress Artifacts (Screenshots, Videos, Reports)
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cypress-artifacts
          path: |
            cypress/reports
            cypress/screenshots
            cypress/videos

      - name: Automation Summary
        id: automation-summary
        shell: bash
        if: always()
        run: |
          stats=$(jq -s 'reduce .[] as $item ({"passes":0,"failures":0,"pending":0,"skipped":0}; 
            .passes += ($item.stats.passes // 0) |
            .failures += ($item.stats.failures // 0) |
            .pending += ($item.stats.pending // 0) |
            .skipped += ($item.stats.skipped // 0))' cypress/reports/*.json)

          passed=$(echo $stats | jq '.passes')
          failed=$(echo $stats | jq '.failures')
          pending=$(echo $stats | jq '.pending')
          skipped=$(echo $stats | jq '.skipped')
          total=$((passed + failed + pending + skipped))


          echo "### ✅ Cypress Test Summary" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Count |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| 🧪 Total Test Cases | $total |" >> $GITHUB_STEP_SUMMARY
          echo "| ✅ Passed | $passed |" >> $GITHUB_STEP_SUMMARY
          echo "| ❌ Failed | $failed |" >> $GITHUB_STEP_SUMMARY
          echo "| ⏸️ Pending | $pending |" >> $GITHUB_STEP_SUMMARY
          echo "| 🔕 Skipped | $skipped |" >> $GITHUB_STEP_SUMMARY

      - name: Deploy to the object storage bucket
        if: always()
        uses: uhg-pipelines/epl-microsite/deploy/s3docs@dcf44c3b4e36255e9888967c09696f8b38aab3ea
        with:
          bucket-name: 'orx-cat-ar'
          build-directory: './cypress/reports'
          aws-access-key-id: '${{ secrets.ACCESS_KEY_ID }}'
          aws-secret-access-key: '${{ secrets.SECRET_ACCESS_KEY }}'

      - name: Print Report URL
        run: |
          echo "Report URL: https://s3api-dmz.optum.com/orx-cat-ar/index.html"
