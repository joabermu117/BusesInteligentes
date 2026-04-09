import { MenuItem, TextField } from "@mui/material";
import { useFormik } from "formik";
import FormDialog from "../../common/components/forms/FormDialog";
import type { Scope } from "../../models/Scope";
import { scopeSchema } from "../../schemas/scopeSchema";

interface ScopeFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Scope>;
  onCancel: () => void;
  onSubmit: (values: Partial<Scope>) => Promise<void>;
  isLoading: boolean;
  isOpen: boolean;
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const ScopeFormModal = ({
  mode,
  initialData = { url: "", method: "GET", model: "" },
  onCancel,
  onSubmit,
  isLoading,
  isOpen,
}: ScopeFormProps) => {
  const formik = useFormik({
    initialValues: {
      url: initialData.url || "",
      method: initialData.method || "GET",
      model: initialData.model || "",
      ...(mode === "edit" && { id: initialData.id || "" }),
    },
    validationSchema: scopeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  const title = mode === "create" ? "Nuevo permiso" : "Editar permiso";
  const submitText = mode === "create" ? "Crear" : "Guardar cambios";

  const handleClose = () => {
    formik.resetForm();
    onCancel();
  };

  return (
    <FormDialog
      open={isOpen}
      title={title}
      onClose={handleClose}
      onSubmit={() => void formik.submitForm()}
      submitLabel={submitText}
      submitting={isLoading || formik.isSubmitting}
      canSubmit={formik.isValid}
      maxWidth="md"
    >
      <TextField
        fullWidth
        id="url"
        name="url"
        label="URL"
        placeholder="Ej: /api/users"
        value={formik.values.url}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.url && Boolean(formik.errors.url)}
        helperText={formik.touched.url && formik.errors.url}
        disabled={isLoading}
        sx={{ mb: 3 }}
      />

      <TextField
        select
        fullWidth
        id="method"
        name="method"
        label="Metodo HTTP"
        value={formik.values.method}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.method && Boolean(formik.errors.method)}
        helperText={formik.touched.method && formik.errors.method}
        disabled={isLoading}
        sx={{ mb: 3 }}
      >
        {HTTP_METHODS.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        id="model"
        name="model"
        label="Modelo"
        placeholder="Ej: User"
        value={formik.values.model}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.model && Boolean(formik.errors.model)}
        helperText={formik.touched.model && formik.errors.model}
        disabled={isLoading}
      />
    </FormDialog>
  );
};
