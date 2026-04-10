import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

export interface SelectableChecklistItem {
  key: string;
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  caption?: string;
}

interface SelectableChecklistProps {
  title: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelectAll: () => void;
  onUnselectFiltered: () => void;
  onClearAll?: () => void;
  disableSelectAll: boolean;
  disableUnselectFiltered: boolean;
  disableClearAll?: boolean;
  selectAllLabel: string;
  unselectLabel: string;
  items: SelectableChecklistItem[];
  onToggle: (key: string) => void;
  emptyMessage: string;
}

const actionButtonSx = {
  color: "primary.main",
  textDecoration: "underline",
  textTransform: "none",
  minWidth: "auto",
  padding: "2px 4px",
  fontSize: "0.75rem",
  "&:hover": {
    backgroundColor: "transparent",
    textDecoration: "underline",
  },
};

const SelectableChecklist = ({
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSelectAll,
  onUnselectFiltered,
  onClearAll,
  disableSelectAll,
  disableUnselectFiltered,
  disableClearAll = true,
  selectAllLabel,
  unselectLabel,
  items,
  onToggle,
  emptyMessage,
}: SelectableChecklistProps) => {
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          variant="body1"
          sx={{ fontWeight: 500, fontSize: "0.875rem" }}
        >
          {title}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            type="button"
            onClick={onSelectAll}
            size="small"
            disabled={disableSelectAll}
            sx={actionButtonSx}
          >
            {selectAllLabel}
          </Button>
          <Button
            type="button"
            onClick={onUnselectFiltered}
            size="small"
            disabled={disableUnselectFiltered}
            sx={actionButtonSx}
          >
            {unselectLabel}
          </Button>
          {onClearAll ? (
            <Button
              type="button"
              onClick={onClearAll}
              size="small"
              disabled={disableClearAll}
              sx={actionButtonSx}
            >
              Limpiar todos
            </Button>
          ) : null}
        </Box>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          sx: {
            fontSize: "0.875rem",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          },
        }}
      />

      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: 1,
          p: 2,
          maxHeight: 220,
          overflowY: "auto",
          backgroundColor: "#fafafa",
        }}
      >
        {items.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            {emptyMessage}
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1 }}>
            {items.map((item) => (
              <FormControlLabel
                key={item.key}
                control={
                  <Checkbox
                    checked={item.checked}
                    onChange={() => onToggle(item.key)}
                    disabled={Boolean(item.disabled)}
                    size="small"
                    sx={{
                      color: "primary.main",
                      "&.Mui-checked": { color: "primary.main" },
                    }}
                  />
                }
                label={
                  <Box sx={{ opacity: item.disabled ? 0.6 : 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                    >
                      {item.title}
                      {item.caption ? (
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ ml: 1, color: "text.secondary" }}
                        >
                          {item.caption}
                        </Typography>
                      ) : null}
                    </Typography>
                    {item.description ? (
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                      >
                        {item.description}
                      </Typography>
                    ) : null}
                  </Box>
                }
                sx={{ alignItems: "flex-start", m: 0 }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SelectableChecklist;
