import { FC } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Icon,
  Input,
} from '@chakra-ui/react'; // Chakra UI を使う前提です
import { FcSearch } from 'react-icons/fc'; // アイコンも適宜インポートします

type SearchForm = {
  keyword: string;
};

export const SearchForm: FC = () => {
  const {
    control,
    handleSubmit,
  } = useForm<SearchForm>();
  const router = useRouter();

  const onSubmit: SubmitHandler<SearchForm> = (data) => {
    router.push({
      pathname: '/textbooks',
      query: { keyword: data.keyword },
    });
  };

  return (
    <>
      <Flex px={2} alignItems="center">
        <Icon as={FcSearch} w={7} h={7} mr="2" />
        <Heading size="md" color="gray.600">
          検索
        </Heading>
      </Flex>
      <Divider />
      <Box py="5">
        <Controller
          name="keyword"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="キーワードを入力"
              variant="filled"
              size="lg"
              borderRadius="full"
            />
          )}
        />
      </Box>
      <Box pb="10">
        <Button
          onClick={handleSubmit(onSubmit)}
          isFullWidth
          color="white"
          bg="gray.900"
          _hover={{ bg: 'gray.500' }}
        >
          検索
        </Button>
      </Box>
    </>
  );
};
