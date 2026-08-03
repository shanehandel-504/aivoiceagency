const q = $('Compute Quote').first().json;

const contract = {
  quote_id: q.quote_id || null,
  status: q.status,
  all_in_total: (q.all_in_total === undefined ? null : q.all_in_total),
  currency: q.currency || 'USD',
  gratuity_included: true,
  breakdown: Array.isArray(q.breakdown) ? q.breakdown : [],
  rate_source: q.rate_source || 'none',
  rate_card_version: q.rate_card_version || 'RCv1.0',
  superseded_quote_id: q.superseded_quote_id || null,
  reason: q.reason || '',
  message: q.message || '',
  call_id: q.call_id || '',
  tenant_id: q.tenant_id || ''
};

if (q.status === 'QUOTED') {
  contract.vehicle = q.vehicle_name || '';
  contract.basis = q.basis_label || '';
  contract.day_type = q.day_type || '';
  contract.pickup_local = q.pickup_local || '';
  contract.base_amount = q.base_amount;
  contract.service_charge_amount = q.service_charge_amount;
  contract.addons_amount = q.addons_amount;
  contract.tax_amount = q.tax_amount;
  contract.fuel_included = q.fuel_included;
  contract.tolls_included = q.tolls_included;
}

return [{ json: contract }];
