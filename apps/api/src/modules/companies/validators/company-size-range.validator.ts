import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

interface CompanySizeRangeInput {
  companySizeMin?: number;
  companySizeMax?: number;
}

export function IsValidCompanySizeRange(
  validationOptions?: ValidationOptions,
): ClassDecorator {
  return (target) => {
    registerDecorator({
      name: 'isValidCompanySizeRange',

      target,

      propertyName: 'companySizeRange',

      options: validationOptions,

      validator: {
        validate(
          _value: unknown,
          args: ValidationArguments,
        ): boolean {
          const object =
            args.object as CompanySizeRangeInput;

          const min =
            object.companySizeMin;

          const max =
            object.companySizeMax;

          if (
            min === undefined ||
            max === undefined
          ) {
            return true;
          }

          return min <= max;
        },

        defaultMessage(): string {
          return (
            'companySizeMin must be less than ' +
            'or equal to companySizeMax'
          );
        },
      },
    });
  };
}