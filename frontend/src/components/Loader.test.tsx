import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader, Empty, ErrorNote } from './Loader';

// Проверяем состояния интерфейса Ciko.
describe('Состояния интерфейса', () => {

  it('показывает индикатор загрузки', () => {
    render(<Loader />);

    expect(screen.getByRole('status'))
      .toHaveTextContent('Загружаем коллекцию');
  });

  it('показывает сообщение, когда фильмов нет', () => {
    render(
      <Empty
        title="Нет фильмов"
        description="Измени фильтры"
      />
    );

    expect(screen.getByRole('heading', { name: 'Нет фильмов' }))
      .toBeInTheDocument();
  });

  it('показывает сообщение об ошибке', () => {
    render(<ErrorNote error="Ошибка загрузки" />);

    expect(screen.getByRole('alert'))
      .toHaveTextContent('Ошибка загрузки');
  });

});
