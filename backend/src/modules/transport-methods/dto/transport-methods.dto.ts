export class TransportMethodDto {
  type: string;
  name: string;
  estimated_days: string;
}

export class TransportMethodsResponseDto {
  transport_methods: TransportMethodDto[];
}

