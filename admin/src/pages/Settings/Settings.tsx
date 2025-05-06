import { Field } from '@sensinum/strapi-utils';
import { Box, Button, Grid, TextInput } from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { Form, Layouts, Page, useNotification } from '@strapi/strapi/admin';
import { FC, useCallback, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { z } from 'zod';
import { useSaveSettings, useSettings } from '../../hooks/settings.hooks';

import { getTrad } from '../../translations';
import { TranslationKey } from '../../translations/types';
import { FetchSettingsFormSchema, reqSettingsSchema } from '../../validators/settings.validator';

const BaseContainer = styled(Box)`
    border-radius: ${({ theme }) => theme.borderRadius};
    background-color: ${({ theme }) => theme.colors.neutral0};
    border-width: 1px;
    border-color: ${({ theme }) => theme.colors.neutral150};
    padding: ${({ theme }) => theme.spaces[5]};
    width: 100%;
`;

export const Settings: FC = () => {
  const { formatMessage } = useIntl();
  const formRef = useRef<HTMLFormElement>(null);
  const { toggleNotification } = useNotification();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const saveSettingsMutation = useSaveSettings();

  const initialValues = useMemo(() => {
    if (settings) {
      return settings;
    }
    return {
      clientId: '',
      clientSecret: '',
      accessToken: '',
      storeHash: '',
      channelId: '',
      allowedCorsOrigins: '',
      addressStore: '',
    };
  }, [settings]);

  const handleSubmit = useCallback(
    async (
      values: Partial<FetchSettingsFormSchema>,
      setErrors: (errors: Record<keyof FetchSettingsFormSchema, TranslationKey>) => void,
    ) => {
      try {
        const validatedData = reqSettingsSchema.parse(values);
        await saveSettingsMutation.mutateAsync(validatedData);

        toggleNotification({
          type: 'success',
          message: formatMessage(getTrad('form.settings.success.save')),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.issues.reduce<Record<string, TranslationKey>>((acc, issue) => {
            acc[issue.path.join('.')] = issue.message as TranslationKey;
            return acc;
          }, {});

          setErrors(errors);

          toggleNotification({
            type: 'warning',
            message: formatMessage(getTrad('form.settings.error.validationMessage')),
          });
        } else {
          toggleNotification({
            type: 'warning',
            message: 'An error occurred while saving the settings',
          });
        }
      }
    },
    [saveSettingsMutation, formatMessage, toggleNotification],
  );

  const getErrorMessage = (key?: any) => {
    if (!key) {
      return undefined;
    }
    return formatMessage(getTrad(key as TranslationKey));
  };

  if (isLoadingSettings) {
    return <div>Loading...</div>;
  }

  return (
    <Layouts.Root>
      <Form ref={formRef} method="PUT" initialValues={initialValues}>
        {({ values, onChange, setErrors, errors, modified }) => (
          <>
            <Page.Title>{formatMessage(getTrad('header.settings.tabTitle'))}</Page.Title>
            <Page.Main>
              <Layouts.Header
                title={formatMessage(getTrad('header.settings.title'))}
                primaryAction={
                  <Button
                    disabled={!modified}
                    startIcon={<Check />}
                    type="submit"
                    form="settings-form"
                    loading={saveSettingsMutation.isPending}
                    onClick={() => handleSubmit(values, setErrors)}
                  >
                    {formatMessage(getTrad('form.settings.save'))}
                  </Button>
                }
              />

              <Layouts.Content>
                <Box background="neutral100" width="100%" direction="column" alignItems="stretch">
                  <BaseContainer>
                    <Grid.Root gap={6}>
                      <Grid.Item col={6}>
                        <Field
                          required
                          name="clientId"
                          error={getErrorMessage(errors.clientId)}
                          label={formatMessage(getTrad('form.settings.clientId.label'))}
                          hint={formatMessage(getTrad('form.settings.clientId.placeholder'))}
                        >
                          <TextInput
                            name="clientId"

                            placeholder={formatMessage(
                              getTrad('form.settings.clientId.placeholder'),
                            )}
                            error={errors.clientId}
                            value={values.clientId}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>

                      <Grid.Item col={6}>
                        <Field
                          name="clientSecret"
                          error={getErrorMessage(errors.clientSecret)}
                          required
                          label={formatMessage(getTrad('form.settings.clientSecret.label'))}
                          hint={formatMessage(getTrad('form.settings.clientSecret.placeholder'))}
                        >
                          <TextInput
                            name="clientSecret"
                            placeholder={formatMessage(
                              getTrad('form.settings.clientSecret.placeholder'),
                            )}
                            // type="password"
                            error={errors.clientSecret}
                            value={values.clientSecret}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>

                      <Grid.Item col={6}>
                        <Field
                          name="accessToken"
                          error={getErrorMessage(errors.accessToken)}
                          required
                          label={formatMessage(getTrad('form.settings.accessToken.label'))}
                          hint={formatMessage(getTrad('form.settings.accessToken.placeholder'))}
                        >
                          <TextInput
                            name="accessToken"
                            placeholder={formatMessage(
                              getTrad('form.settings.accessToken.placeholder'),
                            )}
                            // type="password"
                            error={errors.accessToken}
                            value={values.accessToken}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>

                      <Grid.Item col={6}>
                        <Field
                          name="storeHash"
                          error={getErrorMessage(errors.storeHash)}
                          required
                          label={formatMessage(getTrad('form.settings.storeHash.label'))}
                          hint={formatMessage(getTrad('form.settings.storeHash.placeholder'))}
                        >
                          <TextInput
                            name="storeHash"
                            placeholder={formatMessage(
                              getTrad('form.settings.storeHash.placeholder'),
                            )}
                            error={errors.storeHash}
                            value={values.storeHash}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>

                      <Grid.Item col={6}>
                        <Field
                          name="channelId"
                          error={getErrorMessage(errors.channelId)}
                          required
                          label={formatMessage(getTrad('form.settings.channelId.label'))}
                          hint={formatMessage(getTrad('form.settings.channelId.placeholder'))}
                        >
                          <TextInput
                            name="channelId"
                            placeholder={formatMessage(
                              getTrad('form.settings.channelId.placeholder'),
                            )}
                            error={errors.channelId}
                            value={values.channelId}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>

                      <Grid.Item col={6}>
                        <Field
                          name="allowedCorsOrigins"
                          error={getErrorMessage(errors.allowedCorsOrigins)}
                          label={formatMessage(getTrad('form.settings.allowedCorsOrigins.label'))}
                          hint={formatMessage(
                            getTrad('form.settings.allowedCorsOrigins.placeholder'),
                          )}
                        >
                          <TextInput
                            name="allowedCorsOrigins"
                            placeholder={formatMessage(
                              getTrad('form.settings.allowedCorsOrigins.placeholder'),
                            )}
                            error={errors.allowedCorsOrigins}
                            value={values.allowedCorsOrigins}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>

                      <Grid.Item col={12}>
                        <Field
                          required
                          name="addressStore"
                          error={getErrorMessage(errors.addressStore)}
                          label={formatMessage(getTrad('form.settings.addressStore.label'))}
                          hint={formatMessage(getTrad('form.settings.addressStore.placeholder'))}
                        >
                          <TextInput
                            name="addressStore"
                            placeholder={formatMessage(
                              getTrad('form.settings.addressStore.placeholder'),
                            )}
                            error={errors.addressStore}
                            value={values.addressStore}
                            onChange={onChange}
                          />
                        </Field>
                      </Grid.Item>
                    </Grid.Root>
                  </BaseContainer>
                </Box>
              </Layouts.Content>
            </Page.Main>
            ;
          </>
        )}
      </Form>
    </Layouts.Root>
  );
};
