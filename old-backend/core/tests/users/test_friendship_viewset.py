from unittest.mock import patch

import pytz
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.users.user_models import Friendship, User, UserInvite
from core.views.user_viewsets import FriendshipViewset

utc = pytz.UTC


class TestFriendshipViewSetCreate(TestCase):
    @patch("core.models.users.signals.Client")
    def test_cannot_create_friendship_without_invite(self, _):
        friendship_create_view = FriendshipViewset.as_view({"post": "create"})

        creator_phone_number = "+447814123456"
        friend_phone_number = "+447814123123"
        creator = User.objects.create(
            username=creator_phone_number, phone_number=creator_phone_number
        )
        friend = User.objects.create(
            username=friend_phone_number, phone_number=friend_phone_number
        )

        # Valid request gives 200 response
        request = APIRequestFactory().post(
            "",
            {
                "creator": creator.id,
                "friend": friend.id,
            },
            format="json",
        )
        force_authenticate(request, user=friend)

        res = friendship_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["creator"]["code"], "user_not_invited")

    @patch("core.models.users.signals.Client")
    def test_cannot_accept_friendship_for_someone_else(self, _):
        friendship_create_view = FriendshipViewset.as_view({"post": "create"})

        creator_phone_number = "+447814123456"
        friend_phone_number = "+447814123123"
        bad_guy_phone_number = "+447814123999"
        creator = User.objects.create(
            username=creator_phone_number, phone_number=creator_phone_number
        )
        friend = User.objects.create(
            username=friend_phone_number, phone_number=friend_phone_number
        )

        existing_invite = UserInvite.objects.create(
            phone_number=friend_phone_number,
            first_name="FIRST",
            last_name="LAST",
            invitee=creator,
        )

        bad_guy = User.objects.create(
            username=bad_guy_phone_number, phone_number=bad_guy_phone_number
        )

        # Valid request gives 200 response
        request = APIRequestFactory().post(
            "",
            {
                "creator": creator.id,
                "friend": friend.id,
            },
            format="json",
        )
        force_authenticate(request, user=bad_guy)

        res = friendship_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["friend"]["code"], "user_not_friend")

    @patch("core.models.users.signals.Client")
    def test_can_create_friendship_with_invite(self, _):
        friendship_create_view = FriendshipViewset.as_view({"post": "create"})

        creator_phone_number = "+447814123456"
        friend_phone_number = "+447814123123"
        creator = User.objects.create(
            username=creator_phone_number, phone_number=creator_phone_number
        )
        friend = User.objects.create(
            username=friend_phone_number, phone_number=friend_phone_number
        )

        existing_invite = UserInvite.objects.create(
            phone_number=friend_phone_number,
            first_name="FIRST",
            last_name="LAST",
            invitee=creator,
        )

        # Valid request gives 200 response
        request = APIRequestFactory().post(
            "",
            {
                "creator": creator.id,
                "friend": friend.id,
            },
            format="json",
        )
        force_authenticate(request, user=friend)

        res = friendship_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["friend"], friend.id)
        self.assertEqual(res.data["creator"], creator.id)

    @patch("core.models.users.signals.Client")
    def test_cannot_create_same_friendship_twice(self, _):
        friendship_create_view = FriendshipViewset.as_view({"post": "create"})

        creator_phone_number = "+447814123456"
        friend_phone_number = "+447814123123"
        creator = User.objects.create(
            username=creator_phone_number, phone_number=creator_phone_number
        )
        friend = User.objects.create(
            username=friend_phone_number, phone_number=friend_phone_number
        )

        existing_invite = UserInvite.objects.create(
            phone_number=friend_phone_number,
            first_name="FIRST",
            last_name="LAST",
            invitee=creator,
        )

        # Valid request gives 200 response
        request = APIRequestFactory().post(
            "",
            {
                "creator": creator.id,
                "friend": friend.id,
            },
            format="json",
        )
        force_authenticate(request, user=friend)

        res = friendship_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["friend"], friend.id)
        self.assertEqual(res.data["creator"], creator.id)

        # Second identical request gives 400 response
        request = APIRequestFactory().post(
            "",
            {
                "creator": creator.id,
                "friend": friend.id,
            },
            format="json",
        )
        force_authenticate(request, user=friend)

        res = friendship_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["non_field_errors"][0].code, "unique")

    # TODO - fix this and uncomment test
    # @patch("core.models.users.signals.Client")
    # def test_cannot_create_same_friendship_as_reversed(self, _):
    #     friendship_create_view = FriendshipViewset.as_view(
    #         {"post": "create"}
    #     )

    #     creator_phone_number = "+447814123456"
    #     friend_phone_number = "+447814123123"
    #     creator = User.objects.create(
    #         username=creator_phone_number,
    #         phone_number=creator_phone_number
    #     )
    #     friend = User.objects.create(
    #         username=friend_phone_number,
    #         phone_number=friend_phone_number
    #     )

    #     existing_invite = UserInvite.objects.create(
    #         phone_number=friend_phone_number,
    #         first_name="FIRST",
    #         last_name="LAST",
    #         invitee=creator
    #     )

    #     reverse_invite = UserInvite.objects.create(
    #         phone_number=creator_phone_number,
    #         first_name="FIRST",
    #         last_name="LAST",
    #         invitee=friend
    #     )

    #     # Valid request gives 200 response
    #     request = APIRequestFactory().post("", {
    #         "creator": creator.id,
    #         "friend": friend.id,
    #     }, format="json")
    #     force_authenticate(request, user=friend)

    #     res = friendship_create_view(request)
    #     self.assertEqual(res.status_code, status.HTTP_201_CREATED)
    #     self.assertEqual(res.data["friend"], friend.id)
    #     self.assertEqual(res.data["creator"], creator.id)

    #     # Second identical request gives 400 response
    #     request = APIRequestFactory().post("", {
    #         "creator": friend.id,
    #         "friend": creator.id,
    #     }, format="json")
    #     force_authenticate(request, user=creator)

    #     res = friendship_create_view(request)
    #     self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class TestFriendshipViewSetList(TestCase):
    @parameterized.expand(
        [
            (
                "Invited friends",
                {
                    "invited_friends": [
                        "+447123123123",
                        "+447234234234",
                        "+447345345345",
                        "+447456456456",
                        "+447567567567",
                    ],
                    "accepted_friends": [],
                    "other_friendships": [],
                },
                [
                    "+447123123123",
                    "+447234234234",
                    "+447345345345",
                    "+447456456456",
                    "+447567567567",
                ],
            ),
            (
                "Accepted friends",
                {
                    "invited_friends": [],
                    "accepted_friends": [
                        "+447123123123",
                        "+447234234234",
                        "+447345345345",
                        "+447456456456",
                        "+447567567567",
                    ],
                    "other_friendships": [],
                },
                [
                    "+447123123123",
                    "+447234234234",
                    "+447345345345",
                    "+447456456456",
                    "+447567567567",
                ],
            ),
            (
                "Invited and accepted friends",
                {
                    "invited_friends": [
                        "+447678678678",
                        "+447789789789",
                    ],
                    "accepted_friends": [
                        "+447123123123",
                        "+447234234234",
                        "+447345345345",
                        "+447456456456",
                        "+447567567567",
                    ],
                    "other_friendships": [],
                },
                [
                    "+447123123123",
                    "+447234234234",
                    "+447345345345",
                    "+447456456456",
                    "+447567567567",
                    "+447678678678",
                    "+447789789789",
                ],
            ),
            (
                "Invited and accepted friends, with other users' friendships",
                {
                    "invited_friends": [
                        "+447678678678",
                        "+447789789789",
                    ],
                    "accepted_friends": [
                        "+447123123123",
                        "+447234234234",
                        "+447345345345",
                        "+447456456456",
                        "+447567567567",
                    ],
                    "other_friendships": [
                        ("+447010010010", "+447212212212"),
                        ("+447010010010", "+447434434434"),
                        ("+447656656656", "+447434434434"),
                        ("+447345456567", "+447567456345"),
                    ],
                },
                [
                    "+447123123123",
                    "+447234234234",
                    "+447345345345",
                    "+447456456456",
                    "+447567567567",
                    "+447678678678",
                    "+447789789789",
                ],
            ),
        ]
    )
    def test_can_list_friends(self, _, friends, expected_friends):
        friendship_list_view = FriendshipViewset.as_view({"get": "list"})

        user_phone_number = "+447814123456"
        user = User.objects.create(
            username=user_phone_number, phone_number=user_phone_number
        )
        all_friendships = []
        for friend_number in friends["invited_friends"]:
            new_friend = User.objects.create(
                username=friend_number, phone_number=friend_number
            )
            new_friendship = Friendship.objects.create(creator=user, friend=new_friend)
            all_friendships.append(new_friendship)

        for friend_number in friends["accepted_friends"]:
            new_friend = User.objects.create(
                username=friend_number, phone_number=friend_number
            )
            new_friendship = Friendship.objects.create(creator=new_friend, friend=user)
            all_friendships.append(new_friendship)

        for creator_number, friend_number in friends["other_friendships"]:
            new_creator, _ = User.objects.get_or_create(
                username=creator_number, phone_number=creator_number
            )
            new_friend, _ = User.objects.get_or_create(
                username=friend_number, phone_number=friend_number
            )
            new_friendship = Friendship.objects.create(
                creator=new_creator, friend=new_friend
            )

        # Valid request gives 200 response
        request = APIRequestFactory().get("")
        force_authenticate(request, user=user)

        res = friendship_list_view(request)

        user = User.objects.get(id=user.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(
                [
                    friendship["creator"]
                    if friendship["creator"] != user.id
                    else friendship["friend"]
                    for friendship in res.data
                ]
            ),
            set([friend.id for friend in user.friends.all()]),
        )


class TestFriendshipViewSetDelete(TestCase):
    def test_deletes_forward_and_reverse(self):
        friendship_delete_view = FriendshipViewset.as_view({"delete": "destroy"})

        user_phone_number = "+447814123456"
        user = User.objects.create(
            username=user_phone_number, phone_number=user_phone_number
        )

        friend_phone_number = "+447814123457"
        friend = User.objects.create(
            username=friend_phone_number, phone_number=friend_phone_number
        )

        all_friendships = Friendship.objects.all()
        num_friendships_initial = len(all_friendships)

        friendship = Friendship.objects.create(creator=user, friend=friend)
        all_friendships = Friendship.objects.all()
        num_friendships_before_request = len(all_friendships)
        self.assertEqual(num_friendships_initial + 2, num_friendships_before_request)

        request = APIRequestFactory().delete("")
        force_authenticate(request, user=user)

        res = friendship_delete_view(request, pk=friendship.id)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        all_friendships = Friendship.objects.all()
        num_friendships_after_request = len(all_friendships)

        self.assertEqual(num_friendships_initial, num_friendships_after_request)

    @patch("core.models.users.signals.Client")
    def test_deletes_stale_user_invites(self, _):
        friendship_delete_view = FriendshipViewset.as_view({"delete": "destroy"})

        user_phone_number = "+447814123456"
        user = User.objects.create(
            username=user_phone_number, phone_number=user_phone_number
        )

        friend_phone_number = "+447814123457"
        friend = User.objects.create(
            username=friend_phone_number, phone_number=friend_phone_number
        )

        all_friendships = Friendship.objects.all()
        num_friendships_initial = len(all_friendships)

        friendship = Friendship.objects.create(creator=user, friend=friend)
        all_friendships = Friendship.objects.all()
        num_friendships_before_request = len(all_friendships)
        self.assertEqual(num_friendships_initial + 2, num_friendships_before_request)

        user_invite = UserInvite.objects.create(
            invitee=user, phone_number=friend_phone_number
        )
        reverse_user_invite = UserInvite.objects.create(
            invitee=friend, phone_number=user_phone_number
        )

        request = APIRequestFactory().delete("")
        force_authenticate(request, user=user)

        res = friendship_delete_view(request, pk=friendship.id)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        all_friendships = Friendship.objects.all()
        num_friendships_after_request = len(all_friendships)

        self.assertEqual(num_friendships_initial, num_friendships_after_request)
        self.assertFalse(UserInvite.objects.filter(id=user_invite.id).exists())
        self.assertFalse(UserInvite.objects.filter(id=reverse_user_invite.id).exists())
