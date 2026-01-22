import type { StylesConfig, GroupBase } from 'react-select';

export const getReactSelectStyles = <
  Option,
  IsMulti extends boolean = false
>(): StylesConfig<Option, IsMulti, GroupBase<Option>> => ({
  control: (base, state) => ({
    ...base,
    minHeight: '45px',
    width: '100%',
    fontSize: '14px',
    boxSizing: 'border-box',
    borderColor: state.isFocused ? '#7F56DA' : base.borderColor,
    boxShadow: state.isFocused ? '0 0 0 1px #7F56DA' : base.boxShadow,
    '&:hover': {
      borderColor: '#7F56DA',
    },
    flexWrap: 'wrap',
    alignItems: 'center',
  }),

  valueContainer: (base) => ({
    ...base,
    padding: '4px 8px',
    fontSize: '14px',
    flexWrap: 'wrap',
  }),

  multiValue: (base) => ({
    ...base,
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    padding: '2px 4px',
    fontSize: '13px',
  }),

  placeholder: (base) => ({
    ...base,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#999',
  }),

  option: (base, state) => ({
    ...base,
    fontSize: '14px',
    backgroundColor: state.isSelected
      ? '#ddd'
      : state.isFocused
        ? '#f0f0f0'
        : 'white',
    color: 'black',
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
});



export const getNativeSelectLikeStyles = <
  Option,
  IsMulti extends boolean = false
>(): StylesConfig<Option, IsMulti, GroupBase<Option>> => ({
  control: (base, state) => ({
    ...base,
    width: '10rem',                  // w-40
    minHeight: '38px',               // native select height
    fontSize: '0.875rem',            // text-sm
    lineHeight: '1.25rem',
    borderRadius: '0.5rem',          // rounded-lg
    borderColor: state.isFocused ? '#7F56DA' : '#D1D5DB',
    backgroundColor: '#fff',
    boxShadow: state.isFocused
      ? '0 0 0 2px rgba(127,86,218,0.4)'
      : 'none',
    '&:hover': {
      borderColor: '#7F56DA',
    },
  }),

  valueContainer: (base) => ({
    ...base,
    padding: '0 1.25rem 0 0.45rem',   // pl-3 pr-9
  }),

  indicatorsContainer: (base) => ({
    ...base,
    paddingRight: '0.75rem',
  }),

  indicatorSeparator: () => ({
    display: 'none',
  }),

  dropdownIndicator: (base) => ({
    ...base,
    padding: 0,
    color: '#6B7280',
  }),

  placeholder: (base) => ({
    ...base,
    color: '#6B7280',
    fontSize: '0.875rem',
  }),

  singleValue: (base) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#111827',
  }),

  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? '#E5E7EB'
      : state.isFocused
        ? '#F3F4F6'
        : '#fff',
    color: '#111827',
  }),

  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
});
