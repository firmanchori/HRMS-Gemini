-- Load-test finding (2026-11-08): with zero indexes beyond primary keys,
-- every tenant-scoped query (the overwhelming majority of queries in this
-- app — virtually every route filters by tenant_id first) was a sequential
-- scan. At 1000 seeded rows this alone isn't what made requests take
-- 2-8 seconds (see docs/LOAD_TESTING.md for the fuller picture, including
-- the sequential-round-trip cost in resolveVisibleEntityIds/
-- resolveVisibleEmployeeIds), but it's a real, unambiguous gap that gets
-- strictly worse as tenants accumulate more data, and there is no
-- legitimate reason not to have it regardless of the other finding.
--
-- Hand-written (not drizzle-kit generate output) because declaring index()
-- on ~60 tables in schema.ts would be a huge diff for a change that's
-- conceptually one idea repeated; CREATE INDEX IF NOT EXISTS keeps it safe
-- to re-run. Schema.ts intentionally does NOT declare these indexes, so
-- future `drizzle-kit generate` calls won't see or touch them.

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON "tenant_subscriptions"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_account_credits_tenant_id ON "account_credits"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON "invoices"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON "users"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_audit_log_entries_tenant_id ON "audit_log_entries"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_email_configs_tenant_id ON "email_configs"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_affiliate_usages_tenant_id ON "affiliate_usages"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_payment_verifications_tenant_id ON "payment_verifications"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_company_entities_tenant_id ON "company_entities"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_company_divisions_tenant_id ON "company_divisions"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_company_departments_tenant_id ON "company_departments"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_master_job_positions_tenant_id ON "master_job_positions"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_grade_salary_ranges_tenant_id ON "grade_salary_ranges"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_org_change_proposals_tenant_id ON "org_change_proposals"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_org_structure_snapshots_tenant_id ON "org_structure_snapshots"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_org_structure_nodes_tenant_id ON "org_structure_nodes"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_office_locations_tenant_id ON "office_locations"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_education_levels_tenant_id ON "education_levels"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_fields_of_study_tenant_id ON "fields_of_study"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON "employees"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_job_requisitions_tenant_id ON "job_requisitions"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_document_signatory_configs_tenant_id ON "document_signatory_configs"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_job_vacancies_tenant_id ON "job_vacancies"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON "candidates"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_tenant_id ON "onboarding_processes"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_competency_test_type_settings_tenant_id ON "competency_test_type_settings"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_interview_type_settings_tenant_id ON "interview_type_settings"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_templates_tenant_id ON "onboarding_checklist_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_tenant_id ON "probation_evaluations"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_contract_renewal_reviews_tenant_id ON "contract_renewal_reviews"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_approval_items_tenant_id ON "approval_items"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_approval_delegations_tenant_id ON "approval_delegations"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_work_shifts_tenant_id ON "work_shifts"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_employee_schedules_tenant_id ON "employee_schedules"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_tenant_id ON "shift_swap_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_attendance_records_tenant_id ON "attendance_records"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_attendance_correction_requests_tenant_id ON "attendance_correction_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_overtime_requests_tenant_id ON "overtime_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_salary_components_tenant_id ON "salary_components"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_employee_salary_component_assignments_tenant_id ON "employee_salary_component_assignments"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_id ON "payroll_records"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_employee_loans_tenant_id ON "employee_loans"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant_id ON "leave_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_employee_kpis_tenant_id ON "employee_kpis"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_compliance_records_tenant_id ON "compliance_records"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_offboarding_records_tenant_id ON "offboarding_records"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_business_trips_tenant_id ON "business_trips"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON "vendors"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_ga_assets_tenant_id ON "ga_assets"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_tickets_tenant_id ON "asset_maintenance_tickets"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_asset_relocation_logs_tenant_id ON "asset_relocation_logs"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_procurement_orders_tenant_id ON "procurement_orders"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_company_calendar_events_tenant_id ON "company_calendar_events"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_audit_trail_entries_tenant_id ON "audit_trail_entries"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant_id ON "document_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_official_documents_tenant_id ON "official_documents"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_enps_surveys_tenant_id ON "enps_surveys"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_tenant_id ON "vendor_invoices"("tenant_id");

-- Entity-visibility joins (resolveVisibleEntityIds/resolveVisibleEmployeeIds
-- hit these on nearly every tenant route).
CREATE INDEX IF NOT EXISTS idx_entity_closure_descendant ON "entity_closure"("descendant_entity_id");
CREATE INDEX IF NOT EXISTS idx_employees_entity_id ON "employees"("entity_id");
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON "employees"("manager_id");

-- employee_id FKs on the tables scoped via resolveVisibleEmployeeIds +
-- inArray(employeeId, ...) — the pattern this load test specifically
-- exercised (payroll-records, leave-requests).
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON "payroll_records"("employee_id");
CREATE INDEX IF NOT EXISTS idx_employee_loans_employee_id ON "employee_loans"("employee_id");
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON "leave_requests"("employee_id");
CREATE INDEX IF NOT EXISTS idx_employee_kpis_employee_id ON "employee_kpis"("employee_id");
CREATE INDEX IF NOT EXISTS idx_compliance_records_employee_id ON "compliance_records"("employee_id");
CREATE INDEX IF NOT EXISTS idx_offboarding_records_employee_id ON "offboarding_records"("employee_id");
CREATE INDEX IF NOT EXISTS idx_business_trips_employee_id ON "business_trips"("employee_id");
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_employee_id ON "probation_evaluations"("employee_id");
CREATE INDEX IF NOT EXISTS idx_contract_renewal_reviews_employee_id ON "contract_renewal_reviews"("employee_id");
CREATE INDEX IF NOT EXISTS idx_official_documents_target_employee_id ON "official_documents"("target_employee_id");
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_tickets_reporter_employee_id ON "asset_maintenance_tickets"("reporter_employee_id");
CREATE INDEX IF NOT EXISTS idx_ga_assets_assigned_to_employee_id ON "ga_assets"("assigned_to_employee_id");
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON "attendance_records"("employee_id");
CREATE INDEX IF NOT EXISTS idx_attendance_correction_requests_employee_id ON "attendance_correction_requests"("employee_id");
CREATE INDEX IF NOT EXISTS idx_overtime_requests_employee_id ON "overtime_requests"("employee_id");
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_id ON "employee_schedules"("employee_id");

-- Composite index for audit-trail's ORDER BY timestamp DESC LIMIT 2000
-- pattern — a tenant_id-only index still requires a sort step after the
-- index scan; this lets Postgres walk the index in the already-sorted
-- order it needs.
CREATE INDEX IF NOT EXISTS idx_audit_trail_entries_tenant_timestamp ON "audit_trail_entries"("tenant_id", "timestamp" DESC);

-- Other FK columns used as filter/lookup predicates elsewhere in
-- server/routes/tenant.ts.
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor_id ON "vendor_invoices"("vendor_id");
CREATE INDEX IF NOT EXISTS idx_procurement_orders_vendor_id ON "procurement_orders"("vendor_id");
CREATE INDEX IF NOT EXISTS idx_official_documents_template_id ON "official_documents"("template_id");
CREATE INDEX IF NOT EXISTS idx_users_entity_id ON "users"("entity_id");
