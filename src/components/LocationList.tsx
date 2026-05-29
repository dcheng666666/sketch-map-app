import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Location } from "sketch-map-sdk";

interface Props {
  locations: Location[];
  onReorder: (locations: Location[]) => void;
  onRemove: (id: string) => void;
}

function SortableItem({
  location,
  index,
  onRemove,
}: {
  location: Location;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 1 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="location-item"
      {...attributes}
      {...listeners}
    >
      <span className="drag-handle" aria-hidden="true">
        ⋮⋮
      </span>
      <span className="location-index">{index + 1}</span>
      <div className="location-info">
        <strong>{location.name}</strong>
        <span>{location.displayName}</span>
      </div>
      <button
        type="button"
        className="remove-btn"
        onClick={() => onRemove(location.id)}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Remove ${location.name}`}
      >
        ×
      </button>
    </li>
  );
}

export function LocationList({ locations, onReorder, onRemove }: Props) {
  const sensors = useSensors(
    // Require a small drag distance before activating, so clicks on the
    // remove button (or just plain clicks on the row) don't start a drag.
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = locations.findIndex((l) => l.id === active.id);
    const newIndex = locations.findIndex((l) => l.id === over.id);
    onReorder(arrayMove(locations, oldIndex, newIndex));
  };

  if (locations.length === 0) {
    return (
      <p className="empty-hint">
        No places yet. Search above to add your first stop.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={locations.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="location-list">
          {locations.map((loc, i) => (
            <SortableItem
              key={loc.id}
              location={loc}
              index={i}
              onRemove={onRemove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
