import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

type DataTableProps = {
  columns: string[];
  children: ReactNode;
  emptyMessage: string;
  hasData: boolean;
  colSpan?: number;
};

const DataTable = ({
  columns,
  children,
  emptyMessage,
  hasData,
  colSpan,
}: DataTableProps) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 0 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} sx={{ fontWeight: 700 }}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {hasData ? (
            children
          ) : (
            <TableRow>
              <TableCell colSpan={colSpan ?? columns.length} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
