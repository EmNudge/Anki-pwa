import { css } from "solid-styled";

export function FilePicker(props: {
  onFileChange: (file: File) => void | Promise<void>;
}) {
  css`
    input {
      width: 0px;
      height: 0px;
    }

    .button-like {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
  `;

  const handleFileChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      props.onFileChange(file);
    }
  };

  return (
    <label>
      <input type="file" onChange={handleFileChange} />
      <div class="button-like">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-6"
        >
          <path
            fill-rule="evenodd"
            d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V18a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z"
            clip-rule="evenodd"
          />
          <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
        </svg>

        <span>Choose new deck</span>
      </div>
    </label>
  );
}
