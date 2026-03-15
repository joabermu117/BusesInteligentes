import type { ReactNode } from "react";

/**
 * Interfaz que define la estructura de una acción del modal
 * @interface ModalAction
 * @property {string} label - Texto a mostrar en el botón de acción
 * @property {() => void} onClick - Función a ejecutar al hacer clic
 * @property {string} [className] - Clases CSS opcionales para personalizar el botón
 */
interface ModalAction {
  label: string;
  onClick: () => void;
  className?: string;
}

/**
 * Interfaz que define las propiedades del componente Modal
 * @interface ModalProps
 * @property {boolean} isOpen - Controla si el modal está visible
 * @property {() => void} onClose - Función para cerrar el modal
 * @property {string} title - Título del modal
 * @property {ReactNode} children - Contenido principal del modal
 * @property {ModalAction[]} actions - Array de acciones/botones del modal
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions: ModalAction[];
}

/**
 * Componente Modal reutilizable para mostrar advertencias y confirmaciones
 *
 * @component
 * @param {ModalProps} props - Propiedades del componente
 * @param {boolean} props.isOpen - Determina si el modal está abierto
 * @param {() => void} props.onClose - Función para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {ReactNode} props.children - Contenido del cuerpo del modal
 * @param {ModalAction[]} props.actions - Acciones disponibles en el modal
 * @returns {ReactNode | null} Retorna el modal renderizado o null si no está abierto
 *
 */
const Modal = ({ isOpen, onClose, title, children, actions }: ModalProps) => {
  // No renderizar si el modal no está abierto
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Encabezado del modal con título y botón de cerrar */}
          <div className="flex justify-between items-center mb-4">
            <h3 id="modal-title" className="text-lg font-semibold">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Cerrar modal"
            >
              &times;
            </button>
          </div>

          {/* Contenido principal del modal */}
          <div className="mb-6">{children}</div>

          {/* Acciones del modal (botones) */}
          <div className="flex justify-end space-x-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-4 py-2 rounded-md ${action.className || "bg-gray-300 hover:bg-gray-400"}`}
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
