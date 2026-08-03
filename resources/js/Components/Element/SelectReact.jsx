import Select from "react-select";

export default function SelectReact({
    collection,
    value,
    onChange,
    placeholder = "Pilih salah satu...",
}) {
    const options = collection.map((item) => ({
        value: item.id ?? item,
        label: item.name ?? item,
    }));

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            borderRadius: '0.5rem',
            borderColor: state.isFocused ? '#6366f1' : '#cbd5e1',
            boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            '&:hover': {
                borderColor: state.isFocused ? '#6366f1' : '#94a3b8'
            },
            padding: '2px',
            fontSize: '0.875rem',
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected 
                ? '#4f46e5' 
                : state.isFocused 
                    ? '#e0e7ff' 
                    : 'white',
            color: state.isSelected ? 'white' : '#334155',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: '#4f46e5',
                color: 'white'
            }
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            zIndex: 9999
        }),
        menuList: (provided) => ({
            ...provided,
            padding: 0
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#94a3b8'
        })
    };

    return (
        <Select
            className="react-select-container"
            classNamePrefix="react-select"
            options={options}
            placeholder={placeholder}
            styles={customStyles}
            value={
                options.find(
                    (option) => option.value == value
                ) || null
            }
            onChange={(selected) =>
                onChange(selected?.value || "")
            }
            isClearable
        />
    );
}
