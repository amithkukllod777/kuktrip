#!/usr/bin/env bash
# Point trip.kuklabs.com → your EC2 Elastic IP in AWS Route 53.
# Prereq: aws-cli configured with rights to Route 53, and kuklabs.com hosted in Route 53.
# Usage:  EC2_IP=1.2.3.4 ./deploy/create-dns.sh
set -euo pipefail

DOMAIN="trip.kuklabs.com"
ZONE_APEX="kuklabs.com"
: "${EC2_IP:?Set EC2_IP=<your EC2 Elastic IP>, e.g. EC2_IP=13.234.56.78 ./deploy/create-dns.sh}"

# 1) Find the hosted zone id for kuklabs.com
ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$ZONE_APEX" \
  --query "HostedZones[0].Id" --output text | sed 's#/hostedzone/##')
echo "Hosted zone for $ZONE_APEX: $ZONE_ID"

# 2) Create/replace the A record trip.kuklabs.com → EC2 IP
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" \
  --change-batch "{
    \"Comment\": \"Kuk Trip app\",
    \"Changes\": [{
      \"Action\": \"UPSERT\",
      \"ResourceRecordSet\": {
        \"Name\": \"$DOMAIN\",
        \"Type\": \"A\",
        \"TTL\": 300,
        \"ResourceRecords\": [{ \"Value\": \"$EC2_IP\" }]
      }
    }]
  }"

echo "Submitted. Check propagation with:  dig +short $DOMAIN"
