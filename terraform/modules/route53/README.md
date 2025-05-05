# Route 53 Module

This module provisions a public Route 53 hosted zone for your domain.

## Inputs
- `domain_name`: The domain name to create the hosted zone for (e.g., `mentalhealthaide.com`).

## Outputs
- `zone_id`: The ID of the created hosted zone.
- `name_servers`: The list of name servers for the hosted zone. 