import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function isIanaTimeZone(
  value: unknown,
): value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0
  ) {
    return false;
  }

  try {
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: value,
      },
    ).format();

    return true;
  } catch {
    return false;
  }
}

export function IsIanaTimeZone(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (
    target,
    propertyKey,
  ) => {
    registerDecorator({
      name: 'isIanaTimeZone',

      target:
        target.constructor,

      propertyName:
        propertyKey.toString(),

      options:
        validationOptions,

      validator: {
        validate(
          value: unknown,
        ): boolean {
          return isIanaTimeZone(
            value,
          );
        },

        defaultMessage(
          args: ValidationArguments,
        ): string {
          return (
            `${args.property} ` +
            'must be a valid IANA time zone'
          );
        },
      },
    });
  };
}