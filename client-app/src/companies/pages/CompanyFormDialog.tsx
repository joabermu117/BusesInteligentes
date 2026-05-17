import { Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import type { Company, CreateCompanyPayload } from "../models/company";
import {
  useCreateCompany,
  useUpdateCompany,
} from "../stores/useCompaniesStore";

type Props = { open: boolean; company: Company | null; onClose: () => void };
const empty: CreateCompanyPayload = {
  name: "",
  nit: "",
  direccion: "",
  telefono: "",
  email: "",
  activa: true,
};

const CompanyFormDialog = ({ open, company, onClose }: Props) => {
  const edit = !!company;
  const { mutateAsync: create, isPending: c1 } = useCreateCompany();
  const { mutateAsync: update, isPending: c2 } = useUpdateCompany();
  const loading = c1 || c2;
  const [form, setForm] = useState<CreateCompanyPayload>(empty);
  useEffect(() => {
    if (company)
      setForm({
        name: company.name,
        nit: company.nit,
        direccion: company.direccion ?? "",
        telefono: company.telefono ?? "",
        email: company.email ?? "",
        activa: company.activa ?? true,
      });
    else setForm(empty);
  }, [company, open]);
  const h =
    (field: keyof CreateCompanyPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));
  const submit = async () => {
    if (edit && company) await update({ id: company.id, p: form });
    else await create(form);
    onClose();
  };
  return (
    <FormDialog
      open={open}
      title={edit ? "Editar empresa" : "Agregar empresa"}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={edit ? "Guardar" : "Agregar"}
      submitting={loading}
      canSubmit={!!form.name.trim() && !!form.nit.trim() && !loading}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        <TextField
          label="NIT"
          value={form.nit}
          onChange={h("nit")}
          required
          fullWidth
          placeholder="123456789-0"
        />
        <TextField
          label="Nombre"
          value={form.name}
          onChange={h("name")}
          required
          fullWidth
          placeholder="Razón social"
        />
        <TextField
          label="Dirección"
          value={form.direccion}
          onChange={h("direccion")}
          fullWidth
        />
        <TextField
          label="Teléfono"
          value={form.telefono}
          onChange={h("telefono")}
          fullWidth
        />
        <TextField
          label="Email"
          value={form.email}
          onChange={h("email")}
          fullWidth
          type="email"
        />
      </Stack>
    </FormDialog>
  );
};

export default CompanyFormDialog;
