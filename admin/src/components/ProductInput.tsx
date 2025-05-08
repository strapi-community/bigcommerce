import { CustomFieldInputProps, Field } from '@sensinum/strapi-utils';
import { Combobox, ComboboxOption, Flex } from '@strapi/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { FC, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { z } from 'zod';
import { useReadShopProducts } from '../hooks/readProducts.hook';
import { getTrad } from '../translations';

interface Props extends CustomFieldInputProps {}

const validState = z.object({
  name: z.string().optional(),
  productId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
});

const queryClient = new QueryClient();

const autocomplete = { type: 'list', filter: 'contains' } as const;

const getParsedValue = (value: any): Required<z.infer<typeof validState>> => {
  const parsedValue = validState.safeParse(value);
  if (parsedValue.success) {
    return {
      productId: parsedValue.data.productId ?? '',
      name: parsedValue.data.name ?? '',
      id: parsedValue.data.productId ?? '',
    };
  }
  return {
    productId: '',
    name: '',
    id: '',
  };
};

export const ProductInput: FC<Props> = ({
  disabled,
  name,
  description,
  error,
  onChange,
  value,
  required,
}) => {
  const { formatMessage } = useIntl();
  const parsedValue = getParsedValue(value);

  const [query, setQuery] = useState('');

  const { data: products, isLoading: productLoading } = useReadShopProducts({
    query,
  });
  const onChangeBuilder = (field: 'productId') => (nextId: string | undefined) => {
    onChange?.({
      target: {
        name,
        value: {
          ...parsedValue,
          id: parsedValue.productId,
          [field]: nextId,
          name: products?.find(({ id }) => id === nextId)?.name ?? parsedValue.name,
        },
      },
    });
  };
  const onProductChange = onChangeBuilder('productId');
  const onProductClear = () => onProductChange(undefined);

  const data = [
    parsedValue,
    ...(products ?? []).filter(({ id }) => id !== parsedValue.productId),
  ].filter((_) => _ && _.id && _.name);

  const noOptionsMessage = useCallback((value: string) => value.length > 2 ? formatMessage(getTrad('customField.product.noOptions')) : formatMessage(getTrad('customField.product.minCharacters')), [formatMessage]);

  return (
    <Field name={name} hint={description} label={name} error={error}>
      <Flex direction="column" gap={5} width="100%" alignItems="stretch">
        <Combobox
          name={`${name}.product`}
          autocomplete={autocomplete}
          onChange={onProductChange}
          value={parsedValue.productId}
          disabled={disabled}
          width="100%"
          onTextValueChange={debounce(setQuery, 300)}
          required={required}
          placeholder={formatMessage(getTrad('customField.product.placeholder'))}
          loading={productLoading}
          onClear={onProductClear}
          noOptionsMessage={noOptionsMessage}
        >
          {data.map(({ id, name }) => (
            <ComboboxOption key={id} value={id}>
              {name}
            </ComboboxOption>
          ))}
        </Combobox>
      </Flex>
    </Field>
  );
};

export default function ProductInputWrapper(props: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductInput {...props} />
    </QueryClientProvider>
  );
}
