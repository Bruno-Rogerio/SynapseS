import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface ColorOption {
    value: string;
    label: string;
    color: string;
}

const colorOptions: ColorOption[] = [
    { value: 'teal', label: 'Verde Água', color: '#009688' },
    { value: 'cyan', label: 'Ciano', color: '#00bcd4' },
    { value: 'indigo', label: 'Índigo', color: '#3f51b5' },
    { value: 'deepPurple', label: 'Roxo Profundo', color: '#673ab7' },
    { value: 'pink', label: 'Rosa', color: '#e91e63' },
    { value: 'amber', label: 'Âmbar', color: '#ffc107' },
];

interface ColorSelectorProps {
    name: string; // Adicionando a propriedade name
    value: string;
    onChange: (event: SelectChangeEvent<string>) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ name, value, onChange }) => {
    return (
        <FormControl fullWidth margin="normal">
            <InputLabel>Cor do Cartão</InputLabel>
            <Select
                name={name}
                value={value}
                onChange={onChange}
                label="Cor do Cartão"
            >
                {colorOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        <Box display="flex" alignItems="center">
                            <Box
                                width={20}
                                height={20}
                                bgcolor={option.color}
                                marginRight={1}
                                borderRadius="50%"
                            />
                            {option.label}
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ColorSelector;
