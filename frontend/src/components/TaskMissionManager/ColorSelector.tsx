// frontend/src/components/TaskMissionManager/ColorSelector.tsx
import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    SelectChangeEvent,
    Tooltip,
    Grid,
    useTheme,
    alpha
} from '@mui/material';
import { motion } from 'framer-motion';

// Cores disponíveis para seleção, com nomes e valores hexadecimais
const predefinedColors = [
    { name: 'teal', value: '#009688', label: 'Verde-Água' },
    { name: 'blue', value: '#2196F3', label: 'Azul' },
    { name: 'indigo', value: '#3F51B5', label: 'Índigo' },
    { name: 'purple', value: '#9C27B0', label: 'Roxo' },
    { name: 'pink', value: '#E91E63', label: 'Rosa' },
    { name: 'red', value: '#F44336', label: 'Vermelho' },
    { name: 'orange', value: '#FF9800', label: 'Laranja' },
    { name: 'amber', value: '#FFC107', label: 'Âmbar' },
    { name: 'lime', value: '#CDDC39', label: 'Lima' },
    { name: 'green', value: '#4CAF50', label: 'Verde' },
    { name: 'brown', value: '#795548', label: 'Marrom' },
    { name: 'slate', value: '#607D8B', label: 'Ardósia' },
];

interface ColorSelectorProps {
    name: string;
    value: string;
    onChange: (e: SelectChangeEvent<unknown>) => void;
    disabled?: boolean;
    label?: string;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
    name,
    value,
    onChange,
    disabled = false,
    label = 'Cor'
}) => {
    const theme = useTheme();
    const [selectedColor, setSelectedColor] = useState<string>(value || 'teal');

    // Atualizar o estado interno quando o valor externo mudar
    useEffect(() => {
        setSelectedColor(value || 'teal');
    }, [value]);

    // Função para manipular a mudança de cor
    const handleColorChange = (e: SelectChangeEvent<unknown>) => {
        setSelectedColor(e.target.value as string);
        onChange(e);
    };

    // Encontrar detalhes da cor selecionada
    const currentColor = predefinedColors.find(c => c.name === selectedColor) || predefinedColors[0];

    // Determinar se deve usar texto escuro ou claro para contraste
    const isLightColor = (hexColor: string): boolean => {
        // Converter hex para RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        // Calcular luminosidade (fórmula YIQ)
        // 0 = preto, 255 = branco
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128; // >= 128 é considerado claro
    };

    return (
        <FormControl fullWidth disabled={disabled}>
            <InputLabel id={`${name}-color-label`}>{label}</InputLabel>
            <Select
                labelId={`${name}-color-label`}
                id={`${name}-color-select`}
                name={name}
                value={selectedColor}
                onChange={handleColorChange}
                label={label}
                sx={{
                    '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                    }
                }}
                renderValue={(selected) => {
                    const color = predefinedColors.find(c => c.name === selected) || predefinedColors[0];
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '4px',
                                    backgroundColor: color.value,
                                    boxShadow: `0 0 0 1px ${alpha('#000', 0.1)} inset`,
                                }}
                            />
                            <Typography>
                                {color.label}
                            </Typography>
                        </Box>
                    );
                }}
            >
                <Box sx={{ p: 2, pb: 1 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            mb: 2,
                            color: theme.palette.text.secondary,
                            fontWeight: 500
                        }}
                    >
                        Selecione uma cor para a missão
                    </Typography>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        {predefinedColors.map((color) => (
                            <Grid item xs={3} key={color.name}>
                                <Tooltip title={color.label} arrow>
                                    <Box
                                        component={motion.div}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            const event = {
                                                target: {
                                                    name,
                                                    value: color.name
                                                }
                                            } as any;
                                            handleColorChange(event);
                                        }}
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 1,
                                            backgroundColor: color.value,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: color.name === selectedColor
                                                ? `2px solid ${theme.palette.background.paper}`
                                                : `1px solid ${alpha('#000', 0.1)}`,
                                            boxShadow: color.name === selectedColor
                                                ? `0 0 0 2px ${color.value}`
                                                : 'none',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: `0 0 0 3px ${alpha(color.value, 0.4)}`,
                                            },
                                        }}
                                    >
                                        {color.name === selectedColor && (
                                            <Box
                                                component={motion.div}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    backgroundColor: isLightColor(color.value) ? '#000' : '#fff',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Tooltip>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Select>
        </FormControl>
    );
};

export default ColorSelector;
