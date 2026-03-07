import os
import re

log_text = """
Table `public.wallets` has a row level security policy `Users can view their own wallet`
Table `public.tickets` has a row level security policy `Users can view their own tickets`
Table `public.shipments` has a row level security policy `Clients can view own shipments`
Table `public.forwarder_details` has a row level security policy `Forwarders can view own details`
Table `public.forwarder_details` has a row level security policy `Forwarders can update own details`
Table `public.rates` has a row level security policy `Forwarders can manage own rates`
Table `public.quote_requests` has a row level security policy `Clients can view own requests`
Table `public.quotes` has a row level security policy `Forwarders can manage own quotes`
Table `public.quotes` has a row level security policy `Clients can view quotes for their requests`
Table `public.forwarder_rates` has a row level security policy `Forwarders manage own rates`
Table `public.payments` has a row level security policy `Clients can view own payments`
Table `public.payments` has a row level security policy `Forwarders can view payments for their shipments`
Table `public.payments` has a row level security policy `Clients can create payments`
Table `public.forwarder_documents` has a row level security policy `Forwarders can view own documents`
Table `public.tickets` has a row level security policy `Users can create tickets`
Table `public.tickets` has a row level security policy `Users can update their own tickets`
Table `public.user_push_tokens` has a row level security policy `Users can manage their own push tokens`
Table `public.ticket_messages` has a row level security policy `Users can send messages to their tickets`
Table `public.chats` has a row level security policy `Users can view chats they are part of`
Table `public.chats` has a row level security policy `Users can create chats`
Table `public.chat_messages` has a row level security policy `Users can view messages in their chats`
Table `public.chat_messages` has a row level security policy `Users can send messages to their chats`
Table `public.coupons` has a row level security policy `Forwarders can view own coupons`
Table `public.coupons` has a row level security policy `Forwarders can create coupons`
Table `public.coupons` has a row level security policy `Forwarders can update own coupons`
Table `public.coupons` has a row level security policy `Forwarders can delete own coupons`
Table `public.platform_rates` has a row level security policy `Admins can manage platform rates`
Table `public.platform_features` has a row level security policy `Admins can manage features`
Table `public.transactions` has a row level security policy `Users can view their own transactions`
Table `public.forwarder_clients_backup` has a row level security policy `Forwarders can view their own clients`
Table `public.forwarder_clients_backup` has a row level security policy `Forwarders can add clients`
Table `public.forwarder_clients_backup` has a row level security policy `Forwarders can remove clients`
Table `public.forwarder_addresses` has a row level security policy `Forwarders can manage their own addresses`
Table `public.ticket_messages` has a row level security policy `Users can view messages for their tickets`
Table `public.ticket_messages` has a row level security policy `Users can insert messages to their tickets`
Table `public.invoices` has a row level security policy `Users can view their own invoices`
Table `public.forwarder_documents` has a row level security policy `Forwarders can upload own documents`
Table `public.transactions` has a row level security policy `Users can create own transactions`
Table `public.payments` has a row level security policy `Users can view own payments`
Table `public.transactions` has a row level security policy `Users can view own transactions`
Table `public.transactions` has a row level security policy `Users can view their own wallet transactions`
Table `public.rfq_offers` has a row level security policy `Clients can view offers on their RFQs`
Table `public.rfq_offers` has a row level security policy `Forwarders can update own pending offers`
Table `public.rfq_offers` has a row level security policy `Forwarders can delete own pending offers`
Table `public.coupon_usages` has a row level security policy `Users can view their own coupon usages`
Table `public.rfq_offers` has a row level security policy `Clients can update offer status`
Table `public.rfq_offers` has a row level security policy `Admins can view all offers`
Table `public.rfq_offers` has a row level security policy `Admins can update all offers`
Table `public.coupon_usages` has a row level security policy `Users can create coupon usages`
Table `public.shipment_documents` has a row level security policy `Users can view documents`
Table `public.shipment_documents` has a row level security policy `Users can upload documents`
Table `public.shipments` has a row level security policy `Forwarders can view assigned shipments`
Table `public.subscription_plans` has a row level security policy `Owner can always manage plans`
Table `public.forwarder_rates` has a row level security policy `Forwarders manage their own rates`
Table `public.notifications` has a row level security policy `Users can view own notifications`
Table `public.notifications` has a row level security policy `Users can update own notifications`
Table `public.forwarder_documents` has a row level security policy `Forwarders can update own documents`
Table `public.user_subscriptions` has a row level security policy `Users can view own subscription`
Table `public.academy_enrollments` has a row level security policy `View own enrollment`
Table `public.shipment_events` has a row level security policy `Users can view their own shipment events`
Table `public.sales_leads` has a row level security policy `Only admins view leads`
Table `public.notifications` has a row level security policy `Users can insert own notifications`
Table `public.locations` has a row level security policy `Users can view their own submissions`
Table `public.rfq_requests` has a row level security policy `Clients can create RFQs`
Table `public.rfq_requests` has a row level security policy `Clients can view own RFQs`
Table `public.rfq_requests` has a row level security policy `Clients can update own draft RFQs`
Table `public.rfq_requests` has a row level security policy `Clients can delete own draft RFQs`
Table `public.user_connections` has a row level security policy `Users can view their own connections`
Table `public.user_subscriptions` has a row level security policy `Users view own subscriptions`
Table `public.consolidations` has a row level security policy `Users can update their own consolidations`
Table `public.consolidations` has a row level security policy `Users can delete their own consolidations`
Table `public.pods` has a row level security policy `Forwarders manage their pods`
Table `public.pods` has a row level security policy `Shippers can view pods`
Table `public.pos_sessions` has a row level security policy `Agents view their own POS sessions`
Table `public.shipment_events` has a row level security policy `Clients can view events for own shipments`
Table `public.pos_sessions` has a row level security policy `Agents create POS sessions`
Table `public.pos_sessions` has a row level security policy `Agents update their own POS sessions`
Table `public.transactions` has a row level security policy `Admins can insert transactions`
Table `public.locations` has a row level security policy `Authenticated users can insert locations`
Table `public.forwarder_documents` has a row level security policy `Admins can view all documents`
Table `public.locations` has a row level security policy `Authenticated users can update locations`
Table `public.locations` has a row level security policy `Authenticated users can delete locations`
Table `public.package_types` has a row level security policy `Authenticated users can insert package types`
Table `public.package_types` has a row level security policy `Authenticated users can update package types`
Table `public.package_types` has a row level security policy `Authenticated users can delete package types`
Table `public.staff_roles` has a row level security policy `Authenticated users can insert roles`
Table `public.staff_roles` has a row level security policy `Authenticated users can update roles`
Table `public.staff_roles` has a row level security policy `Authenticated users can delete roles`
Table `public.shipments` has a row level security policy `Authenticated users can create shipments`
Table `public.shipment_events` has a row level security policy `Forwarders can view events for assigned shipments`
Table `public.shipment_events` has a row level security policy `Relevant users can insert events`
Table `public.consolidations` has a row level security policy `Authenticated users can insert consolidations`
Table `public.fee_configs` has a row level security policy `Admins can manage fees`
Table `public.forwarder_documents` has a row level security policy `Admins can manage all documents`
Table `public.rfq_requests` has a row level security policy `Clients can cancel own RFQs`
Table `public.system_secrets` has a row level security policy `Admins can manage secrets`
Table `public.proof_of_delivery` has a row level security policy `Admins can view all PODs`
Table `public.user_subscriptions` has a row level security policy `Users can create own subscription`
Table `public.user_subscriptions` has a row level security policy `Users can update own subscription`
Table `public.user_subscriptions` has a row level security policy `Admins can manage subscriptions`
Table `public.shipments` has a row level security policy `Forwarders can update their own shipments`
Table `public.payment_gateways` has a row level security policy `Owner can always manage gateways`
Table `public.payment_gateways` has a row level security policy `Admins can manage gateways`
Table `public.documents` has a row level security policy `Users can view own documents`
Table `public.documents` has a row level security policy `Users can upload documents`
Table `public.documents` has a row level security policy `Users can delete own documents`
Table `public.saved_quotes` has a row level security policy `User view own quotes`
Table `public.academy_lessons` has a row level security policy `Students can view lessons of enrolled courses`
"""

policies_to_fix = set()
for line in log_text.strip().split('\n'):
    match = re.search(r'Table `public\.([\w_]+)` has a row level security policy `([^`]+)`', line)
    if match:
        policies_to_fix.add((match.group(1), match.group(2)))

migrations_dir = 'supabase/migrations'
all_sql_content = ""
# Read files in reverse alphabetical order so that newer migrations take precedence if redefining
for filename in reversed(sorted(os.listdir(migrations_dir))):
    if filename.endswith('.sql'):
        with open(os.path.join(migrations_dir, filename), 'r') as f:
            all_sql_content += f.read() + "\n\n"

out_lines = []
out_lines.append("-- Performance fixes for RLS Init Plan warnings")
out_lines.append("-- Automatically generated by parsing all migrations.")
out_lines.append("")

found_count = 0
not_found = []

for table, policy in policies_to_fix:
    # re.DOTALL makes '.' match newlines
    # Use \s+ for whitespaces since they can be newlines
    pattern = r'CREATE\s+POLICY\s+["\']?' + re.escape(policy) + r'["\']?\s+ON\s+(?:public\.)?["\']?' + re.escape(table) + r'["\']?.*?;'
    
    matches = list(re.finditer(pattern, all_sql_content, re.IGNORECASE | re.DOTALL))
    if matches:
        latest_create_stmt = matches[0].group(0)
        out_lines.append(f'DROP POLICY IF EXISTS "{policy}" ON public.{table};')
        out_lines.append(latest_create_stmt)
        out_lines.append("")
        found_count += 1
    else:
        not_found.append((table, policy))

print(f"Found {found_count} out of {len(policies_to_fix)} policies to migrate.")
for table, policy in not_found:
    print(f"Warning: Could not find CREATE POLICY for '{policy}' on table '{table}'.")

with open(os.path.join(migrations_dir, '072_fix_rls_performance.sql'), 'w') as f:
    f.write("\n".join(out_lines))

print("Created 072_fix_rls_performance.sql")
