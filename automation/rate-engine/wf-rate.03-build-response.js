const q = $('Compute Quote').first().json;

const contract = {
  quote_id: q.quote_id || null,
  status: q.status,
  all_in_total: (q.all_in_total === undefined ? null : q.all_in_total),
  currency: q.currency || 'USD',
  service_fee_included: true,
  breakdown: Array.isArray(q.breakdown) ? q.breakdown : [],
  rate_source: q.rate_source || 'none',
  quote_source: q.quote_source || 'NONE',
  rate_card_version: q.rate_card_version || 'RCv2.1',
  calculation_version: q.calculation_version || 'RCv2.1',
  superseded_quote_id: q.superseded_quote_id || null,
  reason: q.reason || '',
  message: q.message || '',
  call_id: q.call_id || '',
  tenant_id: q.tenant_id || ''
};

if (q.demo_framing) contract.demo_framing = q.demo_framing;
if (q.year_rolled) contract.year_rolled = true;
if (q.suggested_vehicle) contract.suggested_vehicle = q.suggested_vehicle;
if (q.capacity_ok === false) contract.capacity_ok = false;
if (q.minimum_applied) contract.minimum_applied = true;
if (q.spoken_trip) contract.spoken_trip = q.spoken_trip;

if (q.status === 'QUOTED') {
  contract.vehicle = q.vehicle_name || '';
  contract.basis = q.basis_label || '';
  contract.day_type = q.day_type || '';
  contract.pickup_local = q.pickup_local || '';
  contract.base_amount = q.base_amount;
  contract.service_fee_amount = q.service_fee_amount;
  contract.addons_amount = q.addons_amount;
  contract.tax_amount = q.tax_amount;
  contract.fuel_included = q.fuel_included;
  contract.tolls_included = q.tolls_included;
  contract.tolls = q.tolls || 0;
  if (q.route_miles !== null && q.route_miles !== undefined) {
    contract.route_miles = q.route_miles;
    contract.route_duration_minutes = q.route_duration_minutes;
    contract.distance_miles = q.route_miles;
    contract.drive_minutes = q.route_duration_minutes;
    contract.mileage_price = q.mileage_price;
    contract.time_price = q.time_price;
    contract.transfer_minimum = q.transfer_minimum;
  }
  if (Array.isArray(q.multipliers_applied) && q.multipliers_applied.length) contract.multipliers_applied = q.multipliers_applied;
  if (q.normalized_origin) contract.normalized_origin = q.normalized_origin;
  if (q.normalized_destination) contract.normalized_destination = q.normalized_destination;
  if (q.exact_rate_row) contract.exact_rate_row = q.exact_rate_row;
}

return [{ json: contract }];

