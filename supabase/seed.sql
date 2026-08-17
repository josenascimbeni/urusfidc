insert into public.fidcs (slug, name, distribution_email, status, min_revenue_cents, segments, operation_types, regions)
values
('multiplica','Multiplica','credito@multiplica.example.com','active',3000000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Nota Comercial','CCB','CPR','Contratos Trading','CDA/WA','CDCA','CRA','Conta Escrow'],array['Brasil']),
('brr','BRR Crédito','credito@brr.example.com','active',500000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Antecipação de Cartão de Crédito','Nota Comercial','Conta Escrow'],array['Brasil']),
('cacau','Cacau Crédito','credito@cacau.example.com','active',2000000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Conta Escrow'],array['SP','MT','MS','MG']),
('delmonte','Del Monte','credito@delmonte.example.com','active',10000000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','CCB'],array['SP','MT','MS','MG']),
('flip','Flip Digital','credito@flip.example.com','active',20000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas'],array['Brasil']),
('agpartners','AG Partners','credito@agpartners.example.com','active',600000000,array['Indústria','Serviços'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro'],array['Brasil']),
('invista','Invista','credito@invista.example.com','active',3000000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','CPR','Contratos Trading','Conta Escrow','Dip Finance'],array['Brasil']),
('grancred','Grancred','credito@grancred.example.com','active',300000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)'],array['SP']),
('intrabank','Intrabank','credito@intrabank.example.com','active',10000000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Antecipação de Cartão de Crédito','CCB','Nota Comercial','Risco Sacado','Conta Escrow'],array['SP','MT','MS','MG']),
('sifra','Sifra','credito@sifra.example.com','active',6000000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Nota Comercial','CCB','CPR','Contratos Trading','CDA/WA','CDCA','CRA','CRI','Importação','Conta Escrow','Dip Finance'],array['Brasil']),
('multiplike','Multiplike','credito@multiplike.example.com','active',3600000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Nota Comercial','CCB','CPR','Contratos Trading','CDA/WA','CDCA','CRA','CRI','Importação','Conta Escrow','Dip Finance'],array['Brasil']),
('acreditar','Acreditar FIDC','credito@acreditar.example.com','active',3600000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Nota Comercial','CPR','Barter','Risco Sacado','Fomento','Intercompany','Conta Escrow'],array['Brasil']),
('adgm','ADGM Banco','credito@adgm.example.com','active',3600000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','CPR','Risco Sacado','Fomento','Intercompany','Conta Escrow'],array['Brasil']),
('otmow','Ótmow','credito@otmow.example.com','active',100000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Licitação de Órgãos Públicos','Conta Escrow'],array['Brasil']),
('stars','Stars Bank','credito@stars.example.com','active',3600000000,array['Agro','Indústria','Varejo','Construção Civil','Transportadora','Serviços','Facilities','Outros'],array['Antecipação de Duplicatas','Antecipação de Contratos (performado)','Antecipação de Contratos (à performar)','Capital de Giro','Nota Comercial','Risco Sacado','Fomento','Intercompany','Conta Escrow'],array['Brasil'])
on conflict (slug) do update set name = excluded.name, min_revenue_cents = excluded.min_revenue_cents, segments = excluded.segments, operation_types = excluded.operation_types, regions = excluded.regions;

with template as (
  insert into public.checklist_templates (id, name, scope, active_version)
  values ('20000000-0000-4000-8000-000000000001', 'Checklist padrão Urus', 'urus_standard', 1)
  on conflict (scope, fidc_id) do update set name = excluded.name
  returning id
), version as (
  insert into public.checklist_versions (id, template_id, version)
  values ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1)
  on conflict (template_id, version) do update set template_id = excluded.template_id
  returning id
)
insert into public.checklist_items (version_id, stable_key, name, detail, instructions, required, multiplicity, validity_days, allowed_mime_types, max_size_mb, expected_evidence, ai_standard, sort_order)
select '21000000-0000-4000-8000-000000000001', item.stable_key, item.name, item.detail, 'Envie ' || lower(item.name) || ' legível e atualizado.', true, item.multiplicity, item.validity_days,
array['application/pdf','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','image/jpeg','image/png'], 25,
array['Razão social ou CNPJ','Período de referência','Documento legível'],
'Conferir identidade da empresa, período, integridade visual e presença das evidências obrigatórias.', item.sort_order
from (values
('revenue','Faturamento anual','Exercícios de 2024, 2025 e 2026','per_year',null::integer,1),
('balance','Balanço e DRE','Exercícios de 2024, 2025 e 2026','per_year',null,2),
('trial','Balancete','Último balancete disponível de 2026','single',null,3),
('debt','Endividamento bancário e fundos','Posição atualizada','single',null,4),
('clients','Curva ABC — clientes','Base atualizada','single',null,5),
('suppliers','Curva ABC — fornecedores','Base atualizada','single',null,6),
('income','IR do(s) sócio(s)','Um documento por sócio','per_partner',null,7),
('articles','Contrato social','Última alteração consolidada','single',null,8),
('company-address','Comprovante de endereço da empresa','Emitido nos últimos 90 dias','single',90,9),
('partner-address','Comprovante de endereço do(s) sócio(s)','Um documento por sócio','per_partner',90,10),
('partner-id','Documento pessoal do(s) sócio(s)','CNH válida','per_partner',null,11)
) as item(stable_key,name,detail,multiplicity,validity_days,sort_order)
on conflict (version_id, stable_key) do update set name = excluded.name, detail = excluded.detail, sort_order = excluded.sort_order;

insert into public.checklist_templates (fidc_id, name, scope, active_version)
select id, 'Checklist adicional — ' || name, 'fidc_additional', 1 from public.fidcs
on conflict (scope, fidc_id) do nothing;

insert into public.checklist_versions (template_id, version)
select id, 1 from public.checklist_templates where scope = 'fidc_additional'
on conflict (template_id, version) do nothing;
