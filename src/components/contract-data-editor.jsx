import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

const CONTRACT_SECTIONS = [
  {
    key: 'applicationDetails',
    title: 'Application Details',
    fields: [
      ['fmRef', 'FM Ref #'],
      ['applicationType', 'Application Type'],
      ['status', 'Status'],
    ],
  },
  {
    key: 'buildingDetails',
    title: 'Building Details',
    fields: [
      ['buildingNo', 'Building No'],
      ['name', 'Name'],
      ['usage', 'Usage'],
      ['block', 'Block'],
      ['plotColon', 'Plot Colon'],
      ['location', 'Location'],
    ],
  },
  {
    key: 'unitDetails',
    title: 'Unit Details',
    fields: [
      ['propertyNumber', 'Property Number'],
      ['type', 'Type'],
      ['name', 'Name'],
      ['subType', 'Sub Type'],
      ['usage', 'Usage'],
      ['etihadWeAccountNo', 'EtihadWE Account No'],
    ],
  },
  {
    key: 'ownerDetails',
    title: 'Owner Details',
    fields: [
      ['name', 'Name'],
      ['mobileRaw', 'Mobile'],
      ['idnRaw', 'IDN'],
    ],
  },
  {
    key: 'tenantDetails',
    title: 'Tenant Details',
    fields: [
      ['name', 'Name'],
      ['mobileRaw', 'Mobile'],
      ['idnRaw', 'IDN'],
    ],
  },
  {
    key: 'contractDetails',
    title: 'Contract Details',
    fields: [
      ['contractNo', 'Contract No'],
      ['startDate', 'Start Date'],
      ['endDate', 'End Date'],
      ['amount', 'Amount'],
      ['termsAndConditions', 'Terms and Conditions'],
      ['status', 'Status'],
    ],
  },
];

function buildInitialContractData(contractData) {
  const source = contractData || {};
  const ownerSource = source.ownerDetails || {};
  const tenantSource = source.tenantDetails || {};

  return {
    applicationDetails: { ...(source.applicationDetails || {}) },
    buildingDetails: { ...(source.buildingDetails || {}) },
    unitDetails: { ...(source.unitDetails || {}) },
    ownerDetails: {
      name: ownerSource.name || '',
      mobileRaw: ownerSource.mobileRaw || ownerSource.mobile || '',
      idnRaw: ownerSource.idnRaw || ownerSource.idn || '',
    },
    tenantDetails: {
      name: tenantSource.name || '',
      mobileRaw: tenantSource.mobileRaw || tenantSource.mobile || '',
      idnRaw: tenantSource.idnRaw || tenantSource.idn || '',
    },
    contractDetails: { ...(source.contractDetails || {}) },
    footer: source.footer || '',
  };
}

export function ContractDataEditor({ contractData, onSave, saving }) {
  const [form, setForm] = useState(() => buildInitialContractData(contractData));

  const updateField = (sectionKey, fieldKey, value) => {
    setForm((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [fieldKey]: value },
    }));
  };

  const updateFooter = (value) => {
    setForm((prev) => ({ ...prev, footer: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ contractData: form });
  };

  const renderFields = (section) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
      {section.fields.map(([fieldKey, label]) => (
        <div key={fieldKey}>
          <label className="label" htmlFor={`cd-${section.key}-${fieldKey}`}>{label}</label>
          <Input
            id={`cd-${section.key}-${fieldKey}`}
            value={String(form[section.key]?.[fieldKey] ?? '')}
            onChange={(e) => updateField(section.key, fieldKey, e.target.value)}
            className="h-9"
          />
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {CONTRACT_SECTIONS.map((section) => (
        <Card key={section.key} className="p-4 space-y-3">
          <h3 className="heading text-sm">{section.title}</h3>
          {renderFields(section)}
        </Card>
      ))}

      <Card className="p-4 space-y-3">
        <h3 className="heading text-sm">Footer</h3>
        <div>
          <label className="label" htmlFor="cd-footer">Footer</label>
          <Input
            id="cd-footer"
            value={String(form.footer ?? '')}
            onChange={(e) => updateFooter(e.target.value)}
            className="h-9"
          />
        </div>
      </Card>

      <div className="flex items-center justify-end pt-1">
        <Button type="submit" size="sm" disabled={saving}>
          <Save size={13} />
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

export default ContractDataEditor;
