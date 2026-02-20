import React, { useState } from 'react';
import { Card } from '../atoms/Card';
import { Heading, Text } from '../atoms/Typography';
import { Beaker, Save } from 'lucide-react';
import { Button } from '../atoms/Button';

export const DyeCocktailInput = () => {
    const [recipe, setRecipe] = useState({
        brand: '',
        shade: '',
        paintGrams: '',
        oxideGrams: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRecipe(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        if (!recipe.brand || !recipe.shade || !recipe.paintGrams || !recipe.oxideGrams) {
            alert('Пожалуйста, заполните все поля рецепта.');
            return;
        }

        const dataToSave = {
            brand: recipe.brand,
            shade: recipe.shade,
            paintGrams: Number(recipe.paintGrams),
            oxideGrams: Number(recipe.oxideGrams),
            timestamp: new Date().toISOString()
        };

        console.log('Dye Recipe Saved:', dataToSave);

        // Очистка формы после сохранения
        setRecipe({
            brand: '',
            shade: '',
            paintGrams: '',
            oxideGrams: ''
        });

        alert('Рецепт успешно сохранен (см. консоль)');
    };

    return (
        <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                    <Beaker size={20} />
                </div>
                <div>
                    <Heading level={3}>Рецепт окрашивания</Heading>
                    <Text className="text-zinc-500 text-sm">Умный ассистент колориста</Text>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                            Бренд красителя
                        </label>
                        <input
                            type="text"
                            name="brand"
                            value={recipe.brand}
                            onChange={handleChange}
                            placeholder="Например: Wella"
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                            Номер/Оттенок
                        </label>
                        <input
                            type="text"
                            name="shade"
                            value={recipe.shade}
                            onChange={handleChange}
                            placeholder="Например: 7/0"
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                            Краска (граммы)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="paintGrams"
                                value={recipe.paintGrams}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                                г
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                            Оксид (граммы)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="oxideGrams"
                                value={recipe.oxideGrams}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
                                г
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                    <Save size={18} />
                    Сохранить рецепт
                </Button>
            </div>
        </Card>
    );
};
